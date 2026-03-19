import "./ethereum-wallet.js";
import "./cardano-wallet.js";
import "./oath-signer.js";
import { walletState } from "../lib/wallet-state.js";

const appTemplate = document.createElement("template");
appTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 820px;
      margin: 0 auto;
      padding: 1.5rem 1rem 2.5rem;
    }

    .devnetBadge {
      position: fixed;
      top: 0.85rem;
      right: 0.85rem;
      z-index: 99;
      background: #991b1b;
      color: #ffffff;
      border-radius: 999px;
      padding: 0.28rem 0.65rem;
      font-size: 0.75rem;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.1rem;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }

    h1, h2 {
      margin: 0;
      color: #0f172a;
    }

    h1 {
      font-size: clamp(1.4rem, 3vw, 1.9rem);
      margin-bottom: 0.35rem;
    }

    p {
      color: #334155;
      margin: 0.45rem 0;
      line-height: 1.5;
    }

    .stepTag {
      margin: 0.55rem 0 1rem;
      color: #64748b;
      font-size: 0.9rem;
    }

    .oathText {
      white-space: pre-wrap;
      line-height: 1.6;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 1rem;
      min-height: 180px;
    }

    .controls {
      margin-top: 1rem;
      display: grid;
      gap: 0.7rem;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.7rem;
      align-items: center;
    }

    input[type="text"] {
      width: 100%;
      padding: 0.65rem 0.7rem;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      font: inherit;
    }

    .chainButtons {
      display: grid;
      gap: 0.7rem;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      margin-top: 0.8rem;
    }

    button {
      border: 0;
      border-radius: 10px;
      padding: 0.62rem 0.95rem;
      font: inherit;
      cursor: pointer;
      color: #ffffff;
      background: #4f46e5;
    }

    button.secondary {
      background: #475569;
    }

    button.ghost {
      background: #e2e8f0;
      color: #0f172a;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .error {
      margin-top: 0.8rem;
      color: #b91c1c;
    }

    .successBox {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      padding: 0.8rem;
      margin: 0.8rem 0;
      overflow-wrap: anywhere;
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      margin-top: 0.6rem;
    }

    a {
      color: #1d4ed8;
    }
  </style>

  <article class="card">
    <div id="devnetBadge" class="devnetBadge" hidden>Devnet Mode</div>
    <h1>Sons of Man Digital Oath</h1>
    <p>Read the oath, sign a commitment on-chain, and share your public proof.</p>
    <p id="stepTag" class="stepTag"></p>
    <section id="stepContent"></section>
    <p id="errorText" class="error" hidden></p>
    <oath-signer id="oathSigner"></oath-signer>
  </article>
`;

class WalletApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(appTemplate.content.cloneNode(true));
    this.currentStep = 1;
    this.hasRead = false;
    this.signerName = "";
    this.selectedChain = "";
    this.isSigning = false;
    this.signResult = null;
    this.oathText = "";
    this.onWalletStateChanged = () => {
      if (this.currentStep === 3) {
        this.syncWalletContinueState();
      }
      this.renderDevnetBadge();
    };
  }

  connectedCallback() {
    this.stepTag = this.shadowRoot.getElementById("stepTag");
    this.stepContent = this.shadowRoot.getElementById("stepContent");
    this.errorText = this.shadowRoot.getElementById("errorText");
    this.devnetBadge = this.shadowRoot.getElementById("devnetBadge");
    this.oathSigner = this.shadowRoot.getElementById("oathSigner");

    window.addEventListener("wallet-state-changed", this.onWalletStateChanged);
    this.renderDevnetBadge();
    this.loadOath();
  }

  disconnectedCallback() {
    window.removeEventListener("wallet-state-changed", this.onWalletStateChanged);
  }

  async loadOath() {
    this.showError("");
    this.stepContent.textContent = "Loading oath...";
    try {
      const response = await fetch("./oath.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load oath.json.");
      }
      const oathPayload = await response.json();
      this.oathText = String(oathPayload?.text || "").trim();
      if (!this.oathText) {
        throw new Error("oath.json does not contain valid oath text.");
      }
      this.renderStep();
    } catch (error) {
      this.showError(error?.message || "Failed to load oath.");
      this.stepContent.textContent = "";
    }
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
    this.errorText.hidden = false;
    this.errorText.textContent = message;
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
    if (!this.oathText) {
      return;
    }
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
      <h2>Read the Oath</h2>
      <div class="oathText">${this.escapeHtml(this.oathText)}</div>
      <div class="controls">
        <label class="row">
          <input id="readCheck" type="checkbox" ${this.hasRead ? "checked" : ""} />
          <span>I have read this oath and choose to continue.</span>
        </label>
        <label>
          <span>Your name</span>
          <input id="nameInput" type="text" maxlength="120" value="${this.escapeHtml(this.signerName)}" placeholder="Type your full name" />
        </label>
        <div class="row">
          <button id="continueBtn" type="button">Continue</button>
        </div>
      </div>
    `;
    const readCheck = this.shadowRoot.getElementById("readCheck");
    const nameInput = this.shadowRoot.getElementById("nameInput");
    const continueBtn = this.shadowRoot.getElementById("continueBtn");

    const sync = () => {
      this.hasRead = readCheck.checked;
      this.signerName = nameInput.value.trim();
      continueBtn.disabled = !(this.hasRead && this.signerName);
    };

    readCheck.addEventListener("change", sync);
    nameInput.addEventListener("input", sync);
    continueBtn.addEventListener("click", () => this.setStep(2));
    sync();
  }

  renderStepTwo() {
    this.stepContent.innerHTML = `
      <h2>Choose Your Chain</h2>
      <p>Select where you want to publish your signed commitment.</p>
      <div class="chainButtons">
        <button id="chooseEthBtn" type="button">Ethereum</button>
        <button id="chooseAdaBtn" type="button">Cardano</button>
      </div>
      <div class="row" style="margin-top: 0.8rem;">
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
      <p>Connect your wallet on the required network, then continue to sign.</p>
      ${walletUi}
      <div class="row" style="margin-top: 0.85rem;">
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
      : "Preparing signature...";
    this.stepContent.innerHTML = `
      <h2>Sign and Submit</h2>
      <p>${loadingText}</p>
      <div class="row">
        <button id="backBtn" class="ghost" type="button" ${this.isSigning ? "disabled" : ""}>Back</button>
      </div>
    `;
    const backBtn = this.shadowRoot.getElementById("backBtn");
    backBtn.addEventListener("click", () => this.setStep(3));
  }

  renderStepFive() {
    const siteUrl = window.location.href;
    const txUrl = this.signResult?.explorerUrl || "";
    const shareText = encodeURIComponent(
      `I signed the Sons of Man digital oath on-chain. Verify here: ${txUrl} and take it yourself at ${siteUrl}`,
    );
    const shareUrl = encodeURIComponent(siteUrl);
    this.stepContent.innerHTML = `
      <h2>Commitment Submitted</h2>
      <div class="successBox">
        <p><strong>Chain:</strong> ${this.signResult?.chain}</p>
        <p><strong>Transaction:</strong> ${this.signResult?.txHash}</p>
        <p><a href="${txUrl}" target="_blank" rel="noopener noreferrer">View transaction in explorer</a></p>
      </div>
      <p>Share your transaction and this site on social media to spread the oath.</p>
      <div class="links">
        <a href="https://twitter.com/intent/tweet?text=${shareText}" target="_blank" rel="noopener noreferrer">Share on X</a>
        <a href="https://www.facebook.com/sharer/sharer.php?u=${shareUrl}" target="_blank" rel="noopener noreferrer">Share on Facebook</a>
        <a href="https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}" target="_blank" rel="noopener noreferrer">Share on LinkedIn</a>
      </div>
      <div class="row" style="margin-top: 0.8rem;">
        <button id="copyTxBtn" class="secondary" type="button">Copy Tx Link</button>
        <button id="downloadPdfBtn" type="button">Download Certificate (PDF)</button>
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
    this.shadowRoot.getElementById("downloadPdfBtn").addEventListener("click", () => {
      this.downloadCertificate(siteUrl, txUrl);
    });
    this.shadowRoot.getElementById("restartBtn").addEventListener("click", () => {
      this.selectedChain = "";
      this.signResult = null;
      this.setStep(1);
    });
  }

  async signCommitment() {
    this.isSigning = true;
    this.renderStepFour();
    try {
      const result = await this.oathSigner.sign({
        chain: this.selectedChain,
        oathText: this.oathText,
        signerName: this.signerName,
      });
      this.signResult = result;
      this.isSigning = false;
      this.setStep(5);
    } catch (error) {
      this.isSigning = false;
      this.showError(error?.message || "Failed to sign and submit transaction.");
      this.setStep(3);
    }
  }

  downloadCertificate(siteUrl, txUrl) {
    const jsPdfModule = window.jspdf;
    if (!jsPdfModule?.jsPDF) {
      this.showError("PDF library is unavailable.");
      return;
    }
    if (typeof window.qrcode !== "function") {
      this.showError("QR code library is unavailable.");
      return;
    }
    const doc = new jsPdfModule.jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Sons of Man - Oath Certificate", 20, 24);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Name: ${this.signerName}`, 20, 40);
    doc.text(`Chain: ${this.signResult.chain}`, 20, 50);
    doc.text("Transaction Link:", 20, 62);
    doc.setTextColor(29, 78, 216);
    doc.text(txUrl, 20, 70, { maxWidth: 170 });
    doc.setTextColor(0, 0, 0);
    doc.text("Site Link:", 20, 86);
    doc.setTextColor(29, 78, 216);
    doc.text(siteUrl, 20, 94, { maxWidth: 170 });
    doc.setTextColor(0, 0, 0);

    const qr = window.qrcode(0, "M");
    qr.addData(txUrl);
    qr.make();
    const qrUrl = qr.createDataURL(5, 2);
    doc.addImage(qrUrl, "PNG", 20, 108, 45, 45);
    doc.setFontSize(10);
    doc.text("QR code links to the transaction explorer page.", 20, 160);

    const safeName = this.signerName.replace(/[^a-z0-9_-]/gi, "_").slice(0, 40) || "signer";
    doc.save(`sons-of-man-certificate-${safeName}.pdf`);
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

customElements.define("wallet-app", WalletApp);
