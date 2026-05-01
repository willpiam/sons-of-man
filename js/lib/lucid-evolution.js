import { API_BASE_URL } from "./api.js";

const LUCID_URL = "https://esm.sh/@lucid-evolution/lucid@0.4.30?bundle";
const LUCID_PROVIDER_URL = "https://esm.sh/@lucid-evolution/provider@0.1.91?bundle";

let lucidModulePromise = null;
let lucidProviderModulePromise = null;

export function loadLucid() {
  if (!lucidModulePromise) {
    lucidModulePromise = import(LUCID_URL);
  }
  return lucidModulePromise;
}

export function loadLucidProvider() {
  if (!lucidProviderModulePromise) {
    lucidProviderModulePromise = import(LUCID_PROVIDER_URL);
  }
  return lucidProviderModulePromise;
}

export function getLucidNetwork(mode) {
  return mode === "devnet" ? "Preview" : "Mainnet";
}

export function getBlockfrostProxyUrl(mode) {
  const network = mode === "devnet" ? "preview" : "mainnet";
  return `${API_BASE_URL}/blockfrost/${network}`;
}

function cborByteStringPayloadHex(hex) {
  const firstByte = Number.parseInt(hex.slice(0, 2), 16);
  const major = firstByte >> 5;
  const additional = firstByte & 0x1f;
  if (major !== 2) {
    return hex;
  }

  let offset = 2;
  let length = 0;
  if (additional < 24) {
    length = additional;
  } else if (additional === 24) {
    length = Number.parseInt(hex.slice(offset, offset + 2), 16);
    offset += 2;
  } else if (additional === 25) {
    length = Number.parseInt(hex.slice(offset, offset + 4), 16);
    offset += 4;
  } else {
    return hex;
  }

  const payloadEnd = offset + length * 2;
  return payloadEnd === hex.length ? hex.slice(offset, payloadEnd) : hex;
}

export async function cardanoAddressHexToBech32(cborHex) {
  if (!cborHex || cborHex.length % 2 !== 0) {
    throw new Error("Invalid hex address from wallet.");
  }

  const { CML } = await loadLucid();
  return CML.Address.from_hex(cborByteStringPayloadHex(cborHex)).to_bech32();
}
