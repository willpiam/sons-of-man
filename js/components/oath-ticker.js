import { listOathEvents } from "../lib/api.js";

const tickerTemplate = document.createElement("template");
tickerTemplate.innerHTML = `
  <style>
    :host {
      display: block;
    }

    .ticker {
      border: 1px solid var(--som-border);
      border-radius: 14px;
      background: rgba(13, 16, 32, 0.8);
      box-shadow: var(--som-shadow);
      overflow: hidden;
    }

    .header {
      padding: 0.7rem 1rem;
      border-bottom: 1px solid rgba(245, 158, 11, 0.2);
      color: var(--som-text-muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .viewport {
      padding: 0.9rem 0.75rem;
    }

    .track {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
    }

    .card {
      padding: 0.7rem 0.8rem;
      border: 1px solid rgba(245, 158, 11, 0.26);
      border-radius: 10px;
      background: rgba(17, 22, 42, 0.88);
      animation: reveal 420ms ease;
    }

    a.card {
      display: block;
      text-decoration: none;
      color: inherit;
    }

    a.card:hover {
      border-color: rgba(251, 191, 36, 0.65);
      background: rgba(22, 28, 52, 0.95);
    }

    .name {
      color: #fef3c7;
      font-weight: 600;
      margin: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .meta {
      margin: 0.3rem 0 0;
      font-size: 0.82rem;
      color: var(--som-text-muted);
      display: flex;
      gap: 0.6rem;
      flex-wrap: wrap;
    }

    .ok {
      color: #86efac;
    }

    .warn {
      color: #fcd34d;
    }

    @keyframes reveal {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  </style>

  <section class="ticker">
    <div class="header">Oath Log</div>
    <div class="viewport">
      <div id="track" class="track"></div>
    </div>
  </section>
`;

class OathTicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(tickerTemplate.content.cloneNode(true));
    this.revealTimer = null;
    this.minRevealDelayMs = 5000;
    this.maxRevealDelayMs = 45000;
    this.rows = [];
    this.visibleCount = 0;
    this.isPaused = false;
    this.onMouseEnter = () => this.pauseReveal();
    this.onMouseLeave = () => this.resumeReveal();
  }

  connectedCallback() {
    this.trackEl = this.shadowRoot.getElementById("track");
    this.addEventListener("mouseenter", this.onMouseEnter);
    this.addEventListener("mouseleave", this.onMouseLeave);
    this.loadOnce();
  }

  disconnectedCallback() {
    this.removeEventListener("mouseenter", this.onMouseEnter);
    this.removeEventListener("mouseleave", this.onMouseLeave);
    this.clearRevealTimer();
  }

  async loadOnce() {
    try {
      const payload = await listOathEvents({
        page: 1,
        limit: 20,
        networkMode: "all",
      });
      const rows = Array.isArray(payload?.data) ? payload.data : [];
      if (!rows.length) {
        this.hidden = true;
        return;
      }
      this.hidden = false;
      this.rows = rows;
      this.visibleCount = 0;
      this.trackEl.innerHTML = "";
      this.revealNext();
    } catch (_error) {
      this.hidden = true;
    }
  }

  revealNext() {
    if (this.visibleCount >= this.rows.length) {
      this.clearRevealTimer();
      return;
    }
    this.visibleCount += 1;
    this.renderVisible();
    this.scheduleNextReveal();
  }

  scheduleNextReveal() {
    this.clearRevealTimer();
    if (this.isPaused || this.visibleCount >= this.rows.length) {
      return;
    }
    this.revealTimer = window.setTimeout(() => this.revealNext(), this.getRandomRevealDelayMs());
  }

  getRandomRevealDelayMs() {
    const min = Math.min(this.minRevealDelayMs, this.maxRevealDelayMs);
    const max = Math.max(this.minRevealDelayMs, this.maxRevealDelayMs);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  pauseReveal() {
    this.isPaused = true;
    this.clearRevealTimer();
  }

  resumeReveal() {
    this.isPaused = false;
    this.scheduleNextReveal();
  }

  clearRevealTimer() {
    if (this.revealTimer) {
      window.clearTimeout(this.revealTimer);
      this.revealTimer = null;
    }
  }

  renderVisible() {
    const visibleRows = this.rows.slice(0, this.visibleCount);
    this.trackEl.innerHTML = visibleRows.map((row) => this.renderCard(row)).join("");
  }

  renderCard(row) {
    const statusClass = row.verified_on_chain ? "ok" : "warn";
    const status = row.verified_on_chain ? "Verified" : "Pending";
    const chain = row.chain === "cardano" ? "Cardano (ADA)" : "Ethereum (ETH)";
    const networkLabel = row.network_mode === "devnet" ? "Testnet" : "Mainnet";
    const chainNetwork = `${chain} ${networkLabel}`;
    const timestamp = this.formatTimestamp(row.created_at);
    const timestampTitle = this.escapeHtml(timestamp.isoText);
    const txUrl = row.explorer_url ? this.escapeHtml(row.explorer_url) : "";
    const content = `
      <p class="name">${this.escapeHtml(row.signer_name || "Anonymous")}</p>
      <p class="meta">
        <span>${this.escapeHtml(chainNetwork)}</span>
        <span title="${timestampTitle}">${this.escapeHtml(timestamp.displayText)}</span>
        <span class="${statusClass}">${status}</span>
      </p>
    `;
    if (!txUrl) {
      return `<article class="card">${content}</article>`;
    }
    return `
      <a class="card" href="${txUrl}" target="_blank" rel="noopener noreferrer" aria-label="View on-chain transaction">
        ${content}
      </a>
    `;
  }

  formatTimestamp(isoValue) {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) {
      return { displayText: "-", isoText: "-" };
    }
    return {
      displayText: date.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZoneName: "short",
      }),
      isoText: date.toISOString(),
    };
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

customElements.define("oath-ticker", OathTicker);
