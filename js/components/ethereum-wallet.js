import { updateWalletState, walletState, getExpectedNetworks } from "../lib/wallet-state.js";

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

    output[hidden] {
      display: none;
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

    .networkWarning {
      margin-top: 0.85rem;
      padding: 0.75rem 0.85rem;
      border-radius: 8px;
      background: rgba(153, 27, 27, 0.25);
      border: 1px solid rgba(248, 113, 113, 0.4);
      color: #fca5a5;
      font-size: 0.92rem;
      line-height: 1.5;
    }

    .networkWarning strong {
      color: #f87171;
    }
  </style>

  <section>
    <h2>Ethereum Wallet</h2>
    <button type="button" id="connectBtn">Connect Ethereum</button>
    <output id="addressOut" hidden></output>
    <div id="networkWarning" class="networkWarning" hidden></div>
    <p id="errorText" class="error" hidden></p>
  </section>
`;

class EthereumWallet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(ethTemplate.content.cloneNode(true));
    this._onChainChanged = (chainId) => this.handleChainChanged(chainId);
  }

  connectedCallback() {
    this.connectBtn = this.shadowRoot.getElementById("connectBtn");
    this.addressOut = this.shadowRoot.getElementById("addressOut");
    this.errorText = this.shadowRoot.getElementById("errorText");
    this.networkWarning = this.shadowRoot.getElementById("networkWarning");

    this.connectBtn.addEventListener("click", () => this.connectWallet());
    this.updateAvailability();

    if (window.ethereum?.on) {
      window.ethereum.on("chainChanged", this._onChainChanged);
    }
  }

  disconnectedCallback() {
    if (window.ethereum?.removeListener) {
      window.ethereum.removeListener("chainChanged", this._onChainChanged);
    }
  }

  updateAvailability() {
    if (!window.ethereum) {
      this.connectBtn.disabled = true;
      updateWalletState("ethereum", { connected: false, address: "" });
      this.showError("No Ethereum wallet provider found (e.g. MetaMask).");
    }
  }

  checkNetworkMismatch(chainId) {
    const mode = walletState.app.networkMode;
    const expected = getExpectedNetworks(mode);

    if (chainId !== expected.ethChainId) {
      const walletNetwork = chainId === "0x1" ? "Mainnet" : chainId === "0xaa36a7" ? "Sepolia" : `chain ${chainId}`;
      this.networkWarning.innerHTML =
        `<strong>Network mismatch:</strong> Your wallet is connected to <strong>${walletNetwork}</strong>, ` +
        `but this site is in <strong>${mode === "devnet" ? "Devnet" : "Mainnet"} mode</strong>. ` +
        `Please switch your wallet to <strong>${expected.ethName}</strong> to continue.`;
      this.networkWarning.hidden = false;
      return true;
    }

    this.networkWarning.hidden = true;
    return false;
  }

  handleChainChanged(chainId) {
    if (!walletState.ethereum.address) {
      return;
    }
    const mismatch = this.checkNetworkMismatch(chainId);
    if (mismatch) {
      updateWalletState("ethereum", { connected: false, address: walletState.ethereum.address });
    } else {
      updateWalletState("ethereum", { connected: true, address: walletState.ethereum.address });
    }
  }

  async connectWallet() {
    this.showError("");
    this.networkWarning.hidden = true;
    this.addressOut.hidden = true;
    this.connectBtn.disabled = true;

    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts || accounts.length === 0) {
        throw new Error("No account was returned by the wallet.");
      }

      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      const mismatch = this.checkNetworkMismatch(chainId);

      this.addressOut.value = accounts[0];
      this.addressOut.textContent = `Address: ${accounts[0]}`;
      this.addressOut.hidden = false;

      if (mismatch) {
        updateWalletState("ethereum", { connected: false, address: accounts[0] });
      } else {
        updateWalletState("ethereum", { connected: true, address: accounts[0] });
      }
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
