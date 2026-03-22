import { convertBits, encodeBech32 } from "../lib/bech32.js";
import { updateWalletState } from "../lib/wallet-state.js";

const cardanoTemplate = document.createElement("template");
cardanoTemplate.innerHTML = `
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
      background: rgba(245, 158, 11, 0.15);
      color: var(--som-accent-strong, #fbbf24);
      cursor: pointer;
    }

    button:hover:not(:disabled) {
      background: rgba(245, 158, 11, 0.28);
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
    <h2>Cardano Wallet</h2>
    <div id="walletList"></div>
    <output id="addressOut" hidden></output>
    <p id="errorText" class="error" hidden></p>
  </section>
`;

function hexToBytes(hex) {
  if (!hex || hex.length % 2 !== 0) {
    throw new Error("Invalid hex address from wallet.");
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function decodeCborByteString(inputBytes) {
  const first = inputBytes[0];
  const major = first >> 5;
  const additional = first & 0x1f;

  if (major !== 2) {
    return null;
  }

  let offset = 1;
  let length = 0;
  if (additional < 24) {
    length = additional;
  } else if (additional === 24) {
    length = inputBytes[offset];
    offset += 1;
  } else if (additional === 25) {
    length = (inputBytes[offset] << 8) | inputBytes[offset + 1];
    offset += 2;
  } else {
    return null;
  }

  if (offset + length > inputBytes.length) {
    return null;
  }

  return inputBytes.slice(offset, offset + length);
}

function detectHrp(addressBytes) {
  const networkId = addressBytes[0] & 0x0f;
  return networkId === 0 ? "addr_test" : "addr";
}

function cborHexAddressToBech32(cborHex) {
  const raw = hexToBytes(cborHex);
  const addressBytes = decodeCborByteString(raw) || raw;
  if (addressBytes.length === 0) {
    throw new Error("Cardano wallet returned an empty address.");
  }
  const bech32Data = convertBits([...addressBytes], 8, 5, true);
  if (!bech32Data) {
    throw new Error("Failed to convert Cardano address to bech32.");
  }
  return encodeBech32(detectHrp(addressBytes), bech32Data);
}

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

      const address = cborHexAddressToBech32(selected);
      updateWalletState("cardano", { connected: true, address, api });
      this.addressOut.value = address;
      this.addressOut.textContent = `Address: ${address}`;
      this.addressOut.hidden = false;
    } catch (error) {
      updateWalletState("cardano", { connected: false, address: "", api: null });
      this.showError(error?.message || "Failed to connect Cardano wallet.");
    } finally {
      this.setButtonsDisabled(false);
    }
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
