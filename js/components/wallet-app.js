import "./ethereum-wallet.js";
import "./cardano-wallet.js";
import "./oath-signer.js";
import { createOathEvent } from "../lib/api.js";
import { walletState } from "../lib/wallet-state.js";

const appTemplate = document.createElement("template");
appTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 820px;
      margin: 0 auto;
      padding: 1.5rem 1rem 2.5rem;
      font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
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
      box-shadow: 0 6px 18px rgba(0, 0, 0, 0.4);
    }

    .card {
      background: var(--som-panel, #11162a);
      border: 1px solid var(--som-border, rgba(245, 158, 11, 0.22));
      border-radius: 14px;
      padding: 1.4rem 1.3rem;
      box-shadow: var(--som-shadow, 0 20px 40px rgba(0, 0, 0, 0.35));
    }

    h1, h2 {
      margin: 0;
      color: #fef3c7;
    }

    h1 {
      font-size: clamp(1.4rem, 3vw, 1.9rem);
      margin-bottom: 0.35rem;
    }

    p {
      color: var(--som-text, #e5e7eb);
      margin: 0.45rem 0;
      line-height: 1.6;
    }

    .stepTag {
      margin: 0.55rem 0 1rem;
      color: var(--som-text-muted, #9ca3af);
      font-size: 0.9rem;
    }

    .oathText {
      white-space: pre-wrap;
      line-height: 1.7;
      background: rgba(6, 6, 15, 0.5);
      border: 1px solid var(--som-border, rgba(245, 158, 11, 0.22));
      border-radius: 8px;
      padding: 1rem 1.1rem;
      min-height: 180px;
      color: var(--som-text, #e5e7eb);
      font-size: 0.97rem;
    }

    .controls {
      margin-top: 1rem;
      display: grid;
      gap: 0.7rem;
    }

    .nameField {
      display: grid;
      gap: 0.35rem;
      width: min(100%, 32rem);
      justify-self: start;
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
      border: 1px solid var(--som-border, rgba(245, 158, 11, 0.22));
      background: rgba(6, 6, 15, 0.5);
      color: var(--som-text, #e5e7eb);
      font: inherit;
    }

    input[type="text"]::placeholder {
      color: var(--som-text-muted, #9ca3af);
    }

    input[type="checkbox"] {
      accent-color: var(--som-accent, #f59e0b);
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
      color: #06060f;
      font-weight: 600;
      background: var(--som-accent, #f59e0b);
    }

    button:hover:not(:disabled) {
      background: var(--som-accent-strong, #fbbf24);
    }

    button.secondary {
      background: rgba(245, 158, 11, 0.15);
      color: var(--som-accent-strong, #fbbf24);
      border: 1px solid var(--som-border, rgba(245, 158, 11, 0.22));
    }

    button.ghost {
      background: rgba(255, 255, 255, 0.06);
      color: var(--som-text-muted, #9ca3af);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error {
      margin-top: 0.8rem;
      color: #f87171;
    }

    .successBox {
      background: rgba(34, 197, 94, 0.08);
      border: 1px solid rgba(34, 197, 94, 0.25);
      border-radius: 8px;
      padding: 0.8rem;
      margin: 0.8rem 0;
      overflow-wrap: anywhere;
    }

    .successBox p {
      color: #bbf7d0;
    }

    .links {
      display: flex;
      flex-wrap: wrap;
      gap: 0.55rem;
      margin-top: 0.6rem;
    }

    a {
      color: var(--som-accent-strong, #fbbf24);
    }

    .topLinks {
      margin-top: 0.35rem;
      margin-bottom: 0.75rem;
    }
  </style>

  <article class="card">
    <div id="devnetBadge" class="devnetBadge" hidden>Devnet Mode</div>
    <h1>Sons of Man Digital Oath</h1>
    <p>Read the oath, sign a commitment on-chain, and share your public proof.</p>
    <p class="topLinks"><a id="logLink" href="./log.html">View Oath Log</a></p>
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
    this.shadowRoot.getElementById("logLink").href = "./log.html" + window.location.search;
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
        <label class="nameField">
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
        <a href="./log.html${window.location.search}">View Oath Log</a>
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

    // Auto-trigger certificate download
    setTimeout(() => this.downloadCertificate(siteUrl, txUrl), 600);
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
      this.submitSignedEvent(result);
      this.isSigning = false;
      this.setStep(5);
    } catch (error) {
      this.isSigning = false;
      this.showError(error?.message || "Failed to sign and submit transaction.");
      this.setStep(3);
    }
  }

  async submitSignedEvent(result) {
    const walletAddress =
      this.selectedChain === "ethereum" ? walletState.ethereum.address : walletState.cardano.address;
    try {
      await createOathEvent({
        signer_name: this.signerName,
        chain: result.chain,
        tx_hash: result.txHash,
        wallet_address: walletAddress || null,
        network_mode: walletState.app.networkMode,
        explorer_url: result.explorerUrl || null,
      });
    } catch (_error) {
      // Intentionally ignore API failures: ceremony completion should not be blocked.
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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const outerMargin = 10;
    const innerMargin = 14;
    const contentLeft = 22;
    const contentRight = pageWidth - 22;
    const contentWidth = contentRight - contentLeft;
    const centerX = pageWidth / 2;
    const accentRgb = [180, 150, 80];

    const drawFrame = () => {
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.6);
      doc.rect(outerMargin, outerMargin, pageWidth - outerMargin * 2, pageHeight - outerMargin * 2);
      doc.setLineWidth(0.3);
      doc.rect(innerMargin, innerMargin, pageWidth - innerMargin * 2, pageHeight - innerMargin * 2);
    };
    drawFrame();

    const signerName = String(this.signerName || "").trim() || "Anonymous Signer";
    const chainValue = this.signResult?.chain || "";
    const isDevnet = walletState.app.networkMode === "devnet";
    const chainLabel =
      chainValue === "ethereum"
        ? isDevnet
          ? "Ethereum (Sepolia)"
          : "Ethereum"
        : chainValue === "cardano"
          ? isDevnet
            ? "Cardano (Preview)"
            : "Cardano"
          : chainValue;
    const txHash = String(this.signResult?.txHash || "").trim() || String(txUrl || "").split("/").pop();
    const txPrefix =
      chainValue === "ethereum"
        ? isDevnet
          ? "sepolia"
          : "ethereum"
        : chainValue === "cardano"
          ? isDevnet
            ? "cardano-preview"
            : "cardano"
          : String(chainValue || "transaction").toLowerCase();
    const txDisplay = txHash ? `${txPrefix}::${txHash}` : txPrefix;
    const issuedDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let cursorY = 30;

    doc.setFont("times", "bold");
    doc.setFontSize(24);
    doc.setTextColor(25, 25, 25);
    doc.text("SONS OF MAN", centerX, cursorY, { align: "center" });
    cursorY += 6;

    doc.setDrawColor(...accentRgb);
    doc.setLineWidth(0.8);
    doc.line(centerX - 30, cursorY, centerX + 30, cursorY);
    cursorY += 8;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(70, 70, 70);
    doc.text("OATH CERTIFICATE", centerX, cursorY, { align: "center" });
    cursorY += 14;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text("Presented to", centerX, cursorY, { align: "center" });
    cursorY += 8;

    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.setTextColor(20, 20, 20);
    doc.text(signerName, centerX, cursorY, { align: "center", maxWidth: contentWidth });
    cursorY += 8;

    const detailsTop = cursorY;
    const detailsHeight = 30;
    doc.setDrawColor(215, 215, 215);
    doc.setFillColor(245, 245, 245);
    if (typeof doc.roundedRect === "function") {
      doc.roundedRect(contentLeft, detailsTop, contentWidth, detailsHeight, 2, 2, "FD");
    } else {
      doc.rect(contentLeft, detailsTop, contentWidth, detailsHeight, "FD");
    }

    let detailsY = detailsTop + 7;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(65, 65, 65);
    doc.text(`Chain: ${chainLabel}`, contentLeft + 4, detailsY);
    doc.text(`Date: ${issuedDate}`, contentLeft + 70, detailsY);
    detailsY += 7;
    doc.text("Transaction:", contentLeft + 4, detailsY);
    detailsY += 5;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(25, 90, 180);
    if (txUrl && typeof doc.textWithLink === "function") {
      doc.textWithLink(txDisplay, contentLeft + 4, detailsY, { url: txUrl, maxWidth: contentWidth - 8 });
    } else {
      doc.text(txDisplay, contentLeft + 4, detailsY, { maxWidth: contentWidth - 8 });
    }
    doc.setTextColor(40, 40, 40);
    cursorY = detailsTop + detailsHeight + 10;

    const qr = window.qrcode(0, "M");
    qr.addData(txUrl);
    qr.make();
    const qrUrl = qr.createDataURL(5, 2);
    const qrSize = 36;
    doc.addImage(qrUrl, "PNG", centerX - qrSize / 2, cursorY, qrSize, qrSize);
    cursorY += qrSize + 7;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(95, 95, 95);
    doc.text("Scan to view the on-chain transaction", centerX, cursorY, { align: "center" });
    cursorY += 10;

    doc.setDrawColor(...accentRgb);
    doc.setLineWidth(0.6);
    doc.line(contentLeft, cursorY, contentRight, cursorY);
    cursorY += 8;

    doc.setFont("times", "bolditalic");
    doc.setFontSize(13);
    doc.setTextColor(80, 65, 40);
    doc.text("The Oath", centerX, cursorY, { align: "center" });
    cursorY += 8;

    doc.setFont("helvetica", "italic");
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const oathLines = doc.splitTextToSize(this.oathText, contentWidth);
    const lineHeight = 5;
    const bottomMargin = 22;
    for (const line of oathLines) {
      if (cursorY + lineHeight > pageHeight - bottomMargin) {
        doc.addPage();
        drawFrame();
        cursorY = 24;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(70, 70, 70);
      }
      doc.text(line, contentLeft, cursorY);
      cursorY += lineHeight;
    }

    const footerY = pageHeight - 20;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(contentLeft, footerY - 4, contentRight, footerY - 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("Site:", contentLeft, footerY);
    doc.setTextColor(25, 90, 180);
    doc.text(siteUrl, contentLeft + 8, footerY, { maxWidth: contentWidth - 8 });

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");

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
