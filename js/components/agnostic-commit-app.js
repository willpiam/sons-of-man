import "./ethereum-wallet.js";
import "./cardano-wallet.js";
import { commitMessage } from "../lib/chain-commit.js";
import { walletState } from "../lib/wallet-state.js";

const appTemplate = document.createElement("template");
appTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      min-height: calc(100vh + 16px);
      margin: -8px;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      color: #0f172a;
      background:
        radial-gradient(circle at top left, rgba(79, 70, 229, 0.12), transparent 34rem),
        linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
      --som-bg: #f8fafc;
      --som-bg-elevated: #ffffff;
      --som-panel: #ffffff;
      --som-text: #0f172a;
      --som-text-muted: #64748b;
      --som-border: #cbd5e1;
      --som-accent: #c7d2fe;
      --som-accent-strong: #4338ca;
      --som-shadow: none;
      --wallet-surface: #f8fafc;
      --wallet-output-bg: #ffffff;
      --wallet-output-border: #cbd5e1;
      --wallet-button-bg: #eef2ff;
      --wallet-button-bg-hover: #e0e7ff;
    }

    * {
      box-sizing: border-box;
    }

    .page {
      min-height: 100vh;
      padding: 2rem 1rem 3rem;
    }

    .shell {
      width: min(100%, 860px);
      margin: 0 auto;
    }

    .hero {
      margin-bottom: 1rem;
    }

    .eyebrow {
      margin: 0 0 0.45rem;
      color: #4f46e5;
      font-size: 0.78rem;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    h1,
    h2 {
      margin: 0;
      color: #0f172a;
      letter-spacing: -0.03em;
    }

    h1 {
      font-size: clamp(2rem, 5vw, 3.6rem);
      line-height: 1;
    }

    h2 {
      font-size: clamp(1.35rem, 3vw, 2rem);
      margin-bottom: 0.45rem;
    }

    p {
      margin: 0.5rem 0 0;
      color: #475569;
      line-height: 1.65;
    }

    .card {
      position: relative;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid rgba(148, 163, 184, 0.35);
      border-radius: 24px;
      padding: clamp(1.25rem, 4vw, 2rem);
      box-shadow: 0 24px 70px rgba(15, 23, 42, 0.12);
      backdrop-filter: blur(12px);
    }

    .devnetBadge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      border-radius: 999px;
      padding: 0.32rem 0.68rem;
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
      font-size: 0.72rem;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }

    .stepTag {
      display: inline-flex;
      margin: 0 0 1rem;
      border-radius: 999px;
      padding: 0.35rem 0.7rem;
      background: #eef2ff;
      color: #3730a3;
      font-size: 0.82rem;
      font-weight: 700;
    }

    .messageField {
      display: grid;
      gap: 0.45rem;
      margin-top: 1rem;
    }

    label {
      color: #334155;
      font-weight: 700;
    }

    textarea {
      width: 100%;
      min-height: 220px;
      resize: vertical;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      padding: 0.9rem 1rem;
      color: #0f172a;
      background: #ffffff;
      font: 0.98rem/1.6 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      outline: none;
    }

    textarea:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.14);
    }

    textarea::placeholder {
      color: #94a3b8;
    }

    .controls,
    .row,
    .chainButtons,
    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      align-items: center;
    }

    .controls {
      margin-top: 1rem;
    }

    .chainButtons {
      margin-top: 1.1rem;
    }

    button,
    .linkButton {
      border: 1px solid transparent;
      border-radius: 12px;
      padding: 0.72rem 1rem;
      color: #ffffff;
      background: #4f46e5;
      font: inherit;
      font-weight: 800;
      cursor: pointer;
      text-decoration: none;
      transition:
        background 0.16s ease,
        border-color 0.16s ease,
        transform 0.16s ease;
    }

    button:hover:not(:disabled),
    .linkButton:hover {
      background: #4338ca;
      transform: translateY(-1px);
    }

    button.secondary {
      color: #3730a3;
      background: #eef2ff;
      border-color: #c7d2fe;
    }

    button.secondary:hover:not(:disabled) {
      background: #e0e7ff;
    }

    button.ghost {
      color: #334155;
      background: #ffffff;
      border-color: #cbd5e1;
    }

    button.ghost:hover:not(:disabled) {
      background: #f8fafc;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none;
    }

    .walletWrap {
      margin-top: 1rem;
    }

    .error {
      margin-top: 1rem;
      color: #b91c1c;
      font-weight: 700;
    }

    .resultBox {
      display: grid;
      gap: 0.65rem;
      margin-top: 1rem;
      padding: 1rem;
      border-radius: 16px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
    }

    .resultLine {
      display: grid;
      gap: 0.2rem;
    }

    .resultLine span {
      color: #64748b;
      font-size: 0.78rem;
      font-weight: 800;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    code {
      color: #111827;
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      font-size: 0.88rem;
      overflow-wrap: anywhere;
    }

    a {
      color: #4338ca;
      font-weight: 800;
    }

    .muted {
      color: #64748b;
      font-size: 0.93rem;
    }

    @media (max-width: 600px) {
      .page {
        padding: 1rem 0.75rem 2rem;
      }

      .devnetBadge {
        position: static;
        width: fit-content;
        margin-bottom: 0.85rem;
      }
    }
  </style>

  <main class="page">
    <div class="shell">
      <header class="hero">
        <p class="eyebrow">On-chain message tool</p>
        <h1>Commit Any Message</h1>
        <p>Write arbitrary text to Ethereum or Cardano, using either mainnet or a supported development network.</p>
      </header>

      <article class="card">
        <div id="devnetBadge" class="devnetBadge" hidden>Devnet Mode</div>
        <p id="stepTag" class="stepTag"></p>
        <section id="stepContent"></section>
        <p id="errorText" class="error" hidden></p>
      </article>
    </div>
  </main>
`;

class AgnosticCommitApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(appTemplate.content.cloneNode(true));
    this.currentStep = 1;
    this.message = "";
    this.selectedChain = "";
    this.isSigning = false;
    this.commitResult = null;
    this.onWalletStateChanged = () => {
      if (this.currentStep === 3) {
        this.syncWalletContinueState();
      }
      this.renderDevnetBadge();
    };
  }

  connectedCallback() {
    if (window.location.pathname === "/commit") {
      console.log("hello world");
    }

    this.stepTag = this.shadowRoot.getElementById("stepTag");
    this.stepContent = this.shadowRoot.getElementById("stepContent");
    this.errorText = this.shadowRoot.getElementById("errorText");
    this.devnetBadge = this.shadowRoot.getElementById("devnetBadge");

    window.addEventListener("wallet-state-changed", this.onWalletStateChanged);
    this.renderDevnetBadge();
    this.renderStep();
  }

  disconnectedCallback() {
    window.removeEventListener("wallet-state-changed", this.onWalletStateChanged);
  }

  renderDevnetBadge() {
    this.devnetBadge.hidden = walletState.app.networkMode !== "devnet";
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

  setStep(step) {
    this.currentStep = step;
    this.showError("");
    this.renderStep();

    if (step === 4) {
      this.signCommitment();
    }
  }

  renderStep() {
    this.stepTag.textContent = `Step ${this.currentStep} of 5`;

    if (this.currentStep === 1) {
      this.renderStepOne();
      return;
    }

    if (this.currentStep === 2) {
      this.renderStepTwo();
      return;
    }

    if (this.currentStep === 3) {
      this.renderStepThree();
      return;
    }

    if (this.currentStep === 4) {
      this.renderStepFour();
      return;
    }

    this.renderStepFive();
  }

  renderStepOne() {
    this.stepContent.innerHTML = `
      <h2>Compose Message</h2>
      <p class="muted">This text will be embedded in a public blockchain transaction. Do not include private information.</p>
      <label class="messageField">
        <span>Message</span>
        <textarea id="messageInput" placeholder="Type the message you want to commit on-chain...">${this.escapeHtml(this.message)}</textarea>
      </label>
      <div class="controls">
        <button id="continueBtn" type="button">Continue</button>
      </div>
    `;

    const messageInput = this.shadowRoot.getElementById("messageInput");
    const continueBtn = this.shadowRoot.getElementById("continueBtn");
    const sync = () => {
      this.message = messageInput.value;
      continueBtn.disabled = !this.message.trim();
    };

    messageInput.addEventListener("input", sync);
    continueBtn.addEventListener("click", () => this.setStep(2));
    sync();
  }

  renderStepTwo() {
    this.stepContent.innerHTML = `
      <h2>Choose Chain</h2>
      <p>Select where this message should be published.</p>
      <div class="chainButtons">
        <button id="chooseEthBtn" type="button">Ethereum</button>
        <button id="chooseAdaBtn" type="button">Cardano</button>
      </div>
      <div class="controls">
        <button id="backBtn" class="ghost" type="button">Back</button>
      </div>
    `;

    this.shadowRoot.getElementById("chooseEthBtn").addEventListener("click", () => {
      this.selectedChain = "ethereum";
      this.setStep(3);
    });
    this.shadowRoot.getElementById("chooseAdaBtn").addEventListener("click", () => {
      this.selectedChain = "cardano";
      this.setStep(3);
    });
    this.shadowRoot.getElementById("backBtn").addEventListener("click", () => this.setStep(1));
  }

  renderStepThree() {
    const chainTitle = this.selectedChain === "cardano" ? "Cardano" : "Ethereum";
    const walletUi = this.selectedChain === "cardano" ? "<cardano-wallet></cardano-wallet>" : "<ethereum-wallet></ethereum-wallet>";

    this.stepContent.innerHTML = `
      <h2>Connect ${chainTitle} Wallet</h2>
      <p>Connect a wallet on the required network, then continue to submit the message.</p>
      <div class="walletWrap">${walletUi}</div>
      <div class="controls">
        <button id="walletContinueBtn" type="button">Continue to Sign</button>
        <button id="backBtn" class="ghost" type="button">Back</button>
      </div>
    `;

    this.shadowRoot.getElementById("walletContinueBtn").addEventListener("click", () => this.setStep(4));
    this.shadowRoot.getElementById("backBtn").addEventListener("click", () => this.setStep(2));
    this.syncWalletContinueState();
  }

  syncWalletContinueState() {
    const continueBtn = this.shadowRoot.getElementById("walletContinueBtn");
    if (!continueBtn) {
      return;
    }

    continueBtn.disabled =
      this.selectedChain === "ethereum" ? !walletState.ethereum.connected : !walletState.cardano.connected;
  }

  renderStepFour() {
    const chainTitle = this.selectedChain === "cardano" ? "Cardano" : "Ethereum";
    const loadingText = this.isSigning
      ? `Awaiting wallet confirmation and broadcasting to ${chainTitle}...`
      : "Preparing transaction...";

    this.stepContent.innerHTML = `
      <h2>Sign and Submit</h2>
      <p>${loadingText}</p>
      <div class="controls">
        <button id="backBtn" class="ghost" type="button" ${this.isSigning ? "disabled" : ""}>Back</button>
      </div>
    `;

    this.shadowRoot.getElementById("backBtn").addEventListener("click", () => this.setStep(3));
  }

  renderStepFive() {
    const txUrl = this.commitResult?.explorerUrl || "";
    this.stepContent.innerHTML = `
      <h2>Message Submitted</h2>
      <p>Your transaction was submitted. Once confirmed, the message can be verified through the explorer link.</p>
      <div class="resultBox">
        <div class="resultLine">
          <span>Chain</span>
          <code>${this.escapeHtml(this.commitResult?.chain || "")}</code>
        </div>
        <div class="resultLine">
          <span>Transaction</span>
          <code>${this.escapeHtml(this.commitResult?.txHash || "")}</code>
        </div>
        <div class="resultLine">
          <span>Explorer</span>
          <a href="${this.escapeAttribute(txUrl)}" target="_blank" rel="noopener noreferrer">View transaction</a>
        </div>
      </div>
      <div class="controls">
        <button id="copyTxBtn" class="secondary" type="button">Copy Tx Link</button>
        <button id="restartBtn" class="ghost" type="button">Start Again</button>
      </div>
    `;

    this.shadowRoot.getElementById("copyTxBtn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(txUrl);
      } catch (error) {
        this.showError(error?.message || "Failed to copy transaction link.");
      }
    });

    this.shadowRoot.getElementById("restartBtn").addEventListener("click", () => {
      this.selectedChain = "";
      this.commitResult = null;
      this.setStep(1);
    });
  }

  async signCommitment() {
    this.isSigning = true;
    this.renderStepFour();

    try {
      this.commitResult = await commitMessage({
        chain: this.selectedChain,
        message: this.message,
      });
      this.isSigning = false;
      this.setStep(5);
    } catch (error) {
      this.isSigning = false;
      this.currentStep = 3;
      this.renderStep();
      this.showError(error?.message || "Failed to sign and submit transaction.");
    }
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  escapeAttribute(value) {
    return this.escapeHtml(value).replaceAll("'", "&#39;");
  }
}

customElements.define("agnostic-commit-app", AgnosticCommitApp);
