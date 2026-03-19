import { sendCardanoCip20Message } from "../lib/cardano-tx.js";
import { walletState } from "../lib/wallet-state.js";

const messageTemplate = document.createElement("template");
messageTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      margin-top: 1rem;
      border: 1px solid #dbe3ff;
      border-radius: 12px;
      padding: 1rem;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(17, 24, 39, 0.06);
    }

    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
    }

    textarea {
      width: 100%;
      min-height: 110px;
      resize: vertical;
      padding: 0.65rem;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font: inherit;
    }

    .actions {
      margin-top: 0.8rem;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    button {
      border: 0;
      border-radius: 10px;
      padding: 0.6rem 0.95rem;
      font: inherit;
      color: #ffffff;
      background: #0f766e;
      cursor: pointer;
    }

    button.cardano {
      background: #4f46e5;
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.6;
    }

    output {
      display: block;
      margin-top: 0.8rem;
      padding: 0.65rem;
      border-radius: 8px;
      background: #f6f7ff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
    }

    .txLink {
      display: inline-block;
      margin-top: 0.45rem;
      color: #1d4ed8;
      text-decoration: underline;
    }

    .error {
      margin-top: 0.8rem;
      color: #b91c1c;
    }

    .mode {
      margin: 0 0 0.7rem;
      color: #334155;
      font-size: 0.94rem;
    }

  </style>

  <section>
    <h2>Write Message On-Chain</h2>
    <p id="modeText" class="mode"></p>
    <textarea id="messageInput" placeholder="Type your message here..."></textarea>
    <div class="actions">
      <button type="button" id="sendEthBtn">Send via Ethereum</button>
      <button type="button" id="sendAdaBtn" class="cardano">Send via Cardano (CIP-20)</button>
    </div>
    <output id="txOut" hidden></output>
    <p id="errorText" class="error" hidden></p>
  </section>
`;

const encoder = new TextEncoder();
const ETH_MAINNET_CHAIN_ID = "0x1";
const ETH_SEPOLIA_CHAIN_ID = "0xaa36a7";
const ETH_DEAD_ADDRESS = "0x000000000000000000000000000000000000dEaD";

function getExplorerUrl(chain, networkMode, txHash) {
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

class MessageSender extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(messageTemplate.content.cloneNode(true));
    this.onWalletStateChanged = () => {
      this.syncButtons();
      this.renderNetworkMode();
    };
  }

  connectedCallback() {
    this.messageInput = this.shadowRoot.getElementById("messageInput");
    this.sendEthBtn = this.shadowRoot.getElementById("sendEthBtn");
    this.sendAdaBtn = this.shadowRoot.getElementById("sendAdaBtn");
    this.txOut = this.shadowRoot.getElementById("txOut");
    this.errorText = this.shadowRoot.getElementById("errorText");
    this.modeText = this.shadowRoot.getElementById("modeText");
    this.sendEthBtn.addEventListener("click", () => this.sendEthereum());
    this.sendAdaBtn.addEventListener("click", () => this.sendCardano());
    window.addEventListener("wallet-state-changed", this.onWalletStateChanged);
    this.syncButtons();
    this.renderNetworkMode();
  }

  disconnectedCallback() {
    window.removeEventListener("wallet-state-changed", this.onWalletStateChanged);
  }

  syncButtons() {
    this.sendEthBtn.disabled = !walletState.ethereum.connected;
    this.sendAdaBtn.disabled = !walletState.cardano.connected;
  }

  getExpectedNetworks() {
    if (walletState.app.networkMode === "devnet") {
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

  renderNetworkMode() {
    const mode = walletState.app.networkMode;
    const targets = this.getExpectedNetworks();
    this.modeText.textContent = `Mode: ${mode} | Ethereum: ${targets.ethName} | Cardano: ${targets.cardanoName}`;
  }

  getMessageText() {
    const message = this.messageInput.value.trim();
    if (!message) {
      throw new Error("Please enter a message before sending.");
    }
    return message;
  }

  setLoading(loading) {
    this.messageInput.disabled = loading;
    this.sendEthBtn.disabled = loading || !walletState.ethereum.connected;
    this.sendAdaBtn.disabled = loading || !walletState.cardano.connected;
  }

  showError(message) {
    if (!message) {
      this.errorText.hidden = true;
      this.errorText.textContent = "";
      return;
    }
    this.errorText.hidden = false;
    this.errorText.textContent = message;
  }

  showTx(prefix, hash, chain) {
    this.txOut.hidden = false;
    this.txOut.value = hash;
    this.txOut.textContent = `${prefix} Tx Hash: ${hash}`;

    const explorerUrl = getExplorerUrl(chain, walletState.app.networkMode, hash);
    if (!explorerUrl) {
      return;
    }

    this.txOut.append(document.createElement("br"));
    const link = document.createElement("a");
    link.className = "txLink";
    link.href = explorerUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "View in Explorer";
    this.txOut.append(link);
  }

  async sendEthereum() {
    this.showError("");
    this.txOut.hidden = true;
    this.setLoading(true);

    try {
      const message = this.getMessageText();
      const from = walletState.ethereum.address;
      if (!window.ethereum || !from) {
        throw new Error("Ethereum wallet is not connected.");
      }
      const expected = this.getExpectedNetworks();
      const actualChainId = await window.ethereum.request({ method: "eth_chainId" });
      if (actualChainId !== expected.ethChainId) {
        throw new Error(
          `Ethereum wallet is on ${actualChainId}. Switch to ${expected.ethName} for ${walletState.app.networkMode} mode.`,
        );
      }

      const to = ETH_DEAD_ADDRESS;
      const data = `0x${utf8ToHex(message)}`;
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from, to, value: "0x0", data }],
      });
      this.showTx("Ethereum", txHash, "ethereum");
    } catch (error) {
      this.showError(error?.message || "Failed to send Ethereum transaction.");
    } finally {
      this.setLoading(false);
    }
  }

  async sendCardano() {
    this.showError("");
    this.txOut.hidden = true;
    this.setLoading(true);

    try {
      const message = this.getMessageText();
      const expected = this.getExpectedNetworks();
      const actualNetworkId = await walletState.cardano.api.getNetworkId();
      if (actualNetworkId !== expected.cardanoNetworkId) {
        throw new Error(
          `Cardano wallet network id is ${actualNetworkId}. Switch to ${expected.cardanoName} for ${walletState.app.networkMode} mode.`,
        );
      }
      const chunks = splitForCip20(message);
      const txHash = await sendCardanoCip20Message(walletState.cardano.api, chunks);
      this.showTx("Cardano", txHash, "cardano");
    } catch (error) {
      this.showError(error?.message || "Failed to submit Cardano CIP-20 transaction.");
    } finally {
      this.setLoading(false);
    }
  }
}

customElements.define("message-sender", MessageSender);
