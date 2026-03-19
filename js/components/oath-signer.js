import { sendCardanoCip20Message } from "../lib/cardano-tx.js";
import { walletState } from "../lib/wallet-state.js";

const encoder = new TextEncoder();
const ETH_MAINNET_CHAIN_ID = "0x1";
const ETH_SEPOLIA_CHAIN_ID = "0xaa36a7";
const ETH_DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

function utf8ToHex(text) {
  const bytes = encoder.encode(text);
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function splitForCip20(text, maxBytes = 64) {
  const chunks = [];
  let current = "";
  for (const char of text) {
    const next = current + char;
    if (encoder.encode(next).length <= maxBytes) {
      current = next;
      continue;
    }
    if (!current) {
      throw new Error("A character exceeds 64 bytes and cannot be encoded for CIP-20.");
    }
    chunks.push(current);
    current = char;
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

function getExpectedNetworks(mode) {
  if (mode === "devnet") {
    return {
      ethChainId: ETH_SEPOLIA_CHAIN_ID,
      ethName: "Sepolia",
      cardanoNetworkId: 0,
      cardanoName: "Preview",
    };
  }
  return {
    ethChainId: ETH_MAINNET_CHAIN_ID,
    ethName: "Mainnet",
    cardanoNetworkId: 1,
    cardanoName: "Mainnet",
  };
}

export function getExplorerUrl(chain, networkMode, txHash) {
  if (!txHash) {
    return "";
  }
  if (chain === "ethereum") {
    return networkMode === "devnet"
      ? `https://sepolia.etherscan.io/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`;
  }
  if (chain === "cardano") {
    return networkMode === "devnet"
      ? `https://preview.cardanoscan.io/transaction/${txHash}`
      : `https://cardanoscan.io/transaction/${txHash}`;
  }
  return "";
}

export function buildCommitmentText(oathText, signerName) {
  const cleanOath = String(oathText || "").trim();
  const cleanName = String(signerName || "").trim();
  if (!cleanOath) {
    throw new Error("Oath text is missing.");
  }
  if (!cleanName) {
    throw new Error("Signer name is required.");
  }
  return `${cleanOath}\n\nSigned by: ${cleanName}`;
}

class OathSigner extends HTMLElement {
  async sign({ chain, oathText, signerName }) {
    const commitment = buildCommitmentText(oathText, signerName);
    const mode = walletState.app.networkMode;
    const expected = getExpectedNetworks(mode);

    if (chain === "ethereum") {
      if (!window.ethereum || !walletState.ethereum.address) {
        throw new Error("Ethereum wallet is not connected.");
      }
      const actualChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (actualChainId !== expected.ethChainId) {
        throw new Error(
          `Ethereum wallet is on ${actualChainId}. Switch to ${expected.ethName} for ${mode} mode.`,
        );
      }
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: walletState.ethereum.address,
            to: ETH_DEAD_ADDRESS,
            value: "0x0",
            data: `0x${utf8ToHex(commitment)}`,
          },
        ],
      });
      const result = { chain, txHash, commitment, explorerUrl: getExplorerUrl(chain, mode, txHash) };
      this.dispatchEvent(new CustomEvent("oath-sign-success", { detail: result }));
      return result;
    }

    if (chain === "cardano") {
      if (!walletState.cardano.api) {
        throw new Error("Cardano wallet is not connected.");
      }
      const actualNetworkId = await walletState.cardano.api.getNetworkId();
      if (actualNetworkId !== expected.cardanoNetworkId) {
        throw new Error(
          `Cardano wallet network id is ${actualNetworkId}. Switch to ${expected.cardanoName} for ${mode} mode.`,
        );
      }
      const chunks = splitForCip20(commitment);
      const txHash = await sendCardanoCip20Message(walletState.cardano.api, chunks);
      const result = { chain, txHash, commitment, explorerUrl: getExplorerUrl(chain, mode, txHash) };
      this.dispatchEvent(new CustomEvent("oath-sign-success", { detail: result }));
      return result;
    }

    throw new Error(`Unsupported chain: ${chain}`);
  }
}

customElements.define("oath-signer", OathSigner);
