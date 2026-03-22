import { updateWalletState } from "../lib/wallet-state.js";

const ethTemplate = document.createElement("template");
ethTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      border: 1px solid var(--som-border, rgba(245, 158, 11, 0.22));
      border-radius: 10px;
      padding: 1rem;
      background: rgba(6, 6, 15, 0.5);
    }

    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
      color: var(--som-text, #e5e7eb);
    }

    button {
      border: 0;
      border-radius: 10px;
      padding: 0.6rem 0.9rem;
      font: inherit;
      font-weight: 600;
      color: #06060f;
      background: var(--som-accent, #f59e0b);
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: var(--som-accent-strong, #fbbf24);
    }

    button:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    output {
      display: block;
      margin-top: 0.85rem;
      padding: 0.65rem;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.08);
      color: var(--som-text, #e5e7eb);
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.88rem;
      overflow-wrap: anywhere;
    }

    .error {
      color: #f87171;
      margin-top: 0.85rem;
    }
  </style>

  <section>
    <h2>Ethereum Wallet</h2>
    <button type="button" id="connectBtn">Connect Ethereum</button>
    <output id="addressOut" hidden></output>
    <p id="errorText" class="error" hidden></p>
  </section>
`;

class EthereumWallet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(ethTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.connectBtn = this.shadowRoot.getElementById("connectBtn");
    this.addressOut = this.shadowRoot.getElementById("addressOut");
    this.errorText = this.shadowRoot.getElementById("errorText");

    this.connectBtn.addEventListener("click", () => this.connectWallet());
    this.updateAvailability();
  }

  updateAvailability() {
    if (!window.ethereum) {
      this.connectBtn.disabled = true;
      updateWalletState("ethereum", { connected: false, address: "" });
      this.showError("No Ethereum wallet provider found (e.g. MetaMask).");
    }
  }

  async connectWallet() {
    this.showError("");
    this.addressOut.hidden = true;
    this.connectBtn.disabled = true;

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No account was returned by the wallet.");
      }
      updateWalletState("ethereum", { connected: true, address: accounts[0] });
      this.addressOut.value = accounts[0];
      this.addressOut.textContent = `Address: ${accounts[0]}`;
      this.addressOut.hidden = false;
    } catch (error) {
      updateWalletState("ethereum", { connected: false, address: "" });
      this.showError(error?.message || "Failed to connect Ethereum wallet.");
    } finally {
      this.connectBtn.disabled = false;
    }
  }

  showError(message) {
    if (!message) {
      this.errorText.hidden = true;
      this.errorText.textContent = "";
      return;
    }
    this.errorText.textContent = message;
    this.errorText.hidden = false;
  }
}

customElements.define("ethereum-wallet", EthereumWallet);
