import { blake2b256 } from "./blake2b.js";
import { bytesToHex, decodeCbor, encodeCbor, hexToBytes } from "./cbor.js";

const DEFAULT_FEE_LOVELACE = 200000n;
const MIN_OUTPUT_LOVELACE = 1000000n;

function cborByteStringPayload(bytes) {
  const major = bytes[0] >> 5;
  const additional = bytes[0] & 0x1f;
  if (major !== 2) {
    return bytes;
  }

  let offset = 1;
  let length = 0;
  if (additional < 24) {
    length = additional;
  } else if (additional === 24) {
    length = bytes[offset];
    offset += 1;
  } else if (additional === 25) {
    length = (bytes[offset] << 8) | bytes[offset + 1];
    offset += 2;
  } else {
    return bytes;
  }

  if (offset + length !== bytes.length) {
    return bytes;
  }
  return bytes.slice(offset, offset + length);
}

function normalizeAddressBytes(hex) {
  const raw = hexToBytes(hex);
  return cborByteStringPayload(raw);
}

function lovelaceFromTxOutput(output) {
  if (!Array.isArray(output) || output.length < 2) {
    throw new Error("Unexpected Cardano TxOut shape.");
  }
  const amount = output[1];
  if (typeof amount === "number" || typeof amount === "bigint") {
    return BigInt(amount);
  }
  if (Array.isArray(amount) && amount.length > 0) {
    return BigInt(amount[0]);
  }
  throw new Error("Unsupported multi-asset amount format.");
}

function decodeUtxo(utxoHex) {
  const decoded = decodeCbor(hexToBytes(utxoHex));
  if (!Array.isArray(decoded) || decoded.length !== 2) {
    throw new Error("Invalid UTXO CBOR from wallet.");
  }
  const txIn = decoded[0];
  const txOut = decoded[1];
  if (!Array.isArray(txIn) || txIn.length !== 2 || !(txIn[0] instanceof Uint8Array)) {
    throw new Error("Invalid UTXO input shape from wallet.");
  }
  return {
    txHash: txIn[0],
    index: Number(txIn[1]),
    lovelace: lovelaceFromTxOutput(txOut),
  };
}

export function buildCip20Metadata(messageChunks) {
  return new Map([[674, new Map([["msg", messageChunks]])]]);
}

export async function sendCardanoCip20Message(api, messageChunks) {
  if (!api) {
    throw new Error("Cardano wallet is not connected.");
  }
  if (!Array.isArray(messageChunks) || messageChunks.length === 0) {
    throw new Error("Message metadata cannot be empty.");
  }

  const utxoHexes = await api.getUtxos();
  if (!utxoHexes || utxoHexes.length === 0) {
    throw new Error("Wallet has no UTXOs available to spend.");
  }

  const changeAddressHex = await api.getChangeAddress();
  const changeAddressBytes = normalizeAddressBytes(changeAddressHex);

  let chosen = null;
  for (const utxoHex of utxoHexes) {
    const parsed = decodeUtxo(utxoHex);
    const outputAmount = parsed.lovelace - DEFAULT_FEE_LOVELACE;
    if (outputAmount >= MIN_OUTPUT_LOVELACE) {
      chosen = parsed;
      break;
    }
  }

  if (!chosen) {
    throw new Error("No spendable UTXO was large enough to cover fee + output.");
  }

  const metadata = buildCip20Metadata(messageChunks);
  const auxiliaryData = metadata;
  const auxHash = blake2b256(encodeCbor(auxiliaryData));

  const outputAmount = chosen.lovelace - DEFAULT_FEE_LOVELACE;
  const txBody = new Map([
    [0, [[chosen.txHash, chosen.index]]],
    [1, [[changeAddressBytes, outputAmount]]],
    [2, DEFAULT_FEE_LOVELACE],
    [7, auxHash],
  ]);

  const unsignedTx = [txBody, new Map(), true, auxiliaryData];
  const unsignedTxHex = bytesToHex(encodeCbor(unsignedTx));
  const witnessSetHex = await api.signTx(unsignedTxHex, true);
  const witnessSet = decodeCbor(hexToBytes(witnessSetHex));

  const signedTx = [txBody, witnessSet, true, auxiliaryData];
  const signedTxHex = bytesToHex(encodeCbor(signedTx));
  return api.submitTx(signedTxHex);
}
