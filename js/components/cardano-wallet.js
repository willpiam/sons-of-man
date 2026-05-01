import { cardanoAddressHexToBech32 } from "../lib/lucid-evolution.js";
import { updateWalletState, walletState, getExpectedNetworks } from "../lib/wallet-state.js";

const cardanoTemplate = document.createElement("template");
cardanoTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      border: 1px solid var(--som-border, rgba(245, 158, 11, 0.22));
      border-radius: 10px;
      padding: 1rem;
      background: var(--wallet-surface, rgba(6, 6, 15, 0.5));
    }

    h2 {
      margin: 0 0 0.75rem;
      font-size: 1.1rem;
      color: var(--som-text, #e5e7eb);
    }

    #walletList {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    button {
      border: 1px solid var(--som-border, rgba(245, 158, 11, 0.22));
      border-radius: 10px;
      padding: 0.55rem 0.9rem;
      font: inherit;
      font-weight: 600;
      background: var(--wallet-button-bg, rgba(245, 158, 11, 0.15));
      color: var(--som-accent-strong, #fbbf24);
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: var(--wallet-button-bg-hover, rgba(245, 158, 11, 0.28));
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
      background: var(--wallet-output-bg, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--wallet-output-border, rgba(255, 255, 255, 0.08));
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
    <h2>Cardano Wallet</h2>
    <div id="walletList"></div>
    <output id="addressOut" hidden></output>
    <div id="networkWarning" class="networkWarning" hidden></div>
    <p id="errorText" class="error" hidden></p>
  </section>
`;

class CardanoWallet extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(cardanoTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.walletList = this.shadowRoot.getElementById("walletList");
    this.addressOut = this.shadowRoot.getElementById("addressOut");
    this.errorText = this.shadowRoot.getElementById("errorText");
    this.networkWarning = this.shadowRoot.getElementById("networkWarning");
    this.renderWalletButtons();
  }

  getWalletProviders() {
    if (!window.cardano) {
      return [];
    }
    return Object.entries(window.cardano).filter(
      ([, wallet]) => wallet && typeof wallet.enable === "function",
    );
  }

  renderWalletButtons() {
    const providers = this.getWalletProviders();
    this.walletList.innerHTML = "";

    if (providers.length === 0) {
      updateWalletState("cardano", { connected: false, address: "", api: null });
      this.showError("No Cardano wallet providers found (Nami, Lace, Eternl, etc.).");
      return;
    }

    this.showError("");
    for (const [walletName] of providers) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `Connect ${walletName}`;
      button.addEventListener("click", () => this.connectWallet(walletName));
      this.walletList.append(button);
    }
  }

  setButtonsDisabled(disabled) {
    const buttons = this.walletList.querySelectorAll("button");
    buttons.forEach((button) => {
      button.disabled = disabled;
    });
  }

  async connectWallet(walletName) {
    this.showError("");
    this.networkWarning.hidden = true;
    this.addressOut.hidden = true;
    this.setButtonsDisabled(true);

    try {
      const wallet = window.cardano?.[walletName];
      if (!wallet || typeof wallet.enable !== "function") {
        throw new Error("Selected wallet provider is not available.");
      }

      const api = await wallet.enable();
      const used = await api.getUsedAddresses();
      const selected = used[0] ?? (await api.getChangeAddress());
      if (!selected) {
        throw new Error("No Cardano addresses were returned by the wallet.");
      }

      const address = await cardanoAddressHexToBech32(selected);

      const networkId = await api.getNetworkId();
      const mismatch = this.checkNetworkMismatch(networkId);

      this.addressOut.value = address;
      this.addressOut.textContent = `Address: ${address}`;
      this.addressOut.hidden = false;

      if (mismatch) {
        updateWalletState("cardano", { connected: false, address, api: null });
      } else {
        updateWalletState("cardano", { connected: true, address, api });
      }
    } catch (error) {
      updateWalletState("cardano", { connected: false, address: "", api: null });
      this.showError(error?.message || "Failed to connect Cardano wallet.");
    } finally {
      this.setButtonsDisabled(false);
    }
  }

  checkNetworkMismatch(networkId) {
    const mode = walletState.app.networkMode;
    const expected = getExpectedNetworks(mode);

    if (networkId !== expected.cardanoNetworkId) {
      const walletNetwork = networkId === 1 ? "Mainnet" : "Preview/Testnet";
      this.networkWarning.innerHTML =
        `<strong>Network mismatch:</strong> Your wallet is connected to <strong>${walletNetwork}</strong>, ` +
        `but this site is in <strong>${mode === "devnet" ? "Devnet" : "Mainnet"} mode</strong>. ` +
        `Please switch your wallet to <strong>${expected.cardanoName}</strong> to continue.`;
      this.networkWarning.hidden = false;
      return true;
    }

    this.networkWarning.hidden = true;
    return false;
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
}

customElements.define("cardano-wallet", CardanoWallet);
