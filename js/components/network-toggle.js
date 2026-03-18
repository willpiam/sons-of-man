import { setNetworkMode, walletState } from "../lib/wallet-state.js";

const networkTemplate = document.createElement("template");
networkTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      margin-bottom: 1rem;
      border: 1px solid #dbe3ff;
      border-radius: 12px;
      padding: 0.9rem;
      background: #ffffff;
      box-shadow: 0 8px 24px rgba(17, 24, 39, 0.06);
    }

    h2 {
      margin: 0 0 0.65rem;
      font-size: 1rem;
    }

    .group {
      display: inline-flex;
      border: 1px solid #c7d2fe;
      border-radius: 10px;
      overflow: hidden;
    }

    button {
      border: 0;
      padding: 0.45rem 0.85rem;
      font: inherit;
      color: #1f2937;
      background: #eef2ff;
      cursor: pointer;
    }

    button[aria-pressed="true"] {
      color: #ffffff;
      background: #4f46e5;
    }

    p {
      margin: 0.6rem 0 0;
      color: #374151;
      font-size: 0.94rem;
    }
  </style>

  <section>
    <h2>Network Mode</h2>
    <div class="group">
      <button type="button" id="mainnetBtn" aria-pressed="true">Mainnet</button>
      <button type="button" id="devnetBtn" aria-pressed="false">Devnet</button>
    </div>
    <p id="targetsText"></p>
  </section>
`;

class NetworkToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(networkTemplate.content.cloneNode(true));
    this.onWalletStateChanged = (event) => {
      if (event.detail?.chain === "app") {
        this.renderMode(walletState.app.networkMode);
      }
    };
  }

  connectedCallback() {
    this.mainnetBtn = this.shadowRoot.getElementById("mainnetBtn");
    this.devnetBtn = this.shadowRoot.getElementById("devnetBtn");
    this.targetsText = this.shadowRoot.getElementById("targetsText");

    this.mainnetBtn.addEventListener("click", () => setNetworkMode("mainnet"));
    this.devnetBtn.addEventListener("click", () => setNetworkMode("devnet"));
    window.addEventListener("wallet-state-changed", this.onWalletStateChanged);
    this.renderMode(walletState.app.networkMode);
  }

  disconnectedCallback() {
    window.removeEventListener("wallet-state-changed", this.onWalletStateChanged);
  }

  renderMode(mode) {
    const isMainnet = mode === "mainnet";
    this.mainnetBtn.setAttribute("aria-pressed", String(isMainnet));
    this.devnetBtn.setAttribute("aria-pressed", String(!isMainnet));
    this.targetsText.textContent = isMainnet
      ? "Ethereum: Mainnet | Cardano: Mainnet"
      : "Ethereum: Sepolia | Cardano: Preview";
  }
}

customElements.define("network-toggle", NetworkToggle);
