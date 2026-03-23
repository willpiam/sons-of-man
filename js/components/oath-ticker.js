import { listOathEvents } from "../lib/api.js";

const tickerTemplate = document.createElement("template");
tickerTemplate.innerHTML = `
  <style>
    :host {
      display: block;
    }

    .container {
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

    .list {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.55rem 1rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .list li:last-child {
      border-bottom: none;
    }

    .name {
      color: var(--som-text, #e5e7eb);
      font-size: 0.92rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
    }

    .time {
      color: var(--som-text-muted, #9ca3af);
      font-size: 0.82rem;
      margin-left: 0.8rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .txLink {
      color: var(--som-accent-strong, #fbbf24);
      font-size: 0.82rem;
      margin-left: 0.8rem;
      white-space: nowrap;
      text-decoration: none;
      flex-shrink: 0;
    }

    .txLink:hover {
      text-decoration: underline;
    }

    .footer {
      padding: 0.55rem 1rem;
      border-top: 1px solid rgba(245, 158, 11, 0.2);
      text-align: right;
    }

    .footer a {
      color: var(--som-accent-strong, #fbbf24);
      font-size: 0.85rem;
      text-decoration: none;
    }

    .footer a:hover {
      text-decoration: underline;
    }
  </style>

  <section class="container">
    <div class="header">Recent Oaths</div>
    <ul id="list" class="list"></ul>
    <div class="footer">
      <a href="./log.html">View full oath log &rarr;</a>
    </div>
  </section>
`;

class OathTicker extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(tickerTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.listEl = this.shadowRoot.getElementById("list");
    this.loadOnce();
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
      this.listEl.innerHTML = rows.map((row) => this.renderRow(row)).join("");
    } catch (_error) {
      this.hidden = true;
    }
  }

  renderRow(row) {
    const name = this.escapeHtml(row.signer_name || "Anonymous");
    const txUrl = row.explorer_url ? this.escapeHtml(row.explorer_url) : "";
    const linkHtml = txUrl
      ? `<a class="txLink" href="${txUrl}" target="_blank" rel="noopener noreferrer">View tx</a>`
      : "";
    const timeHtml = row.created_at
      ? `<span class="time">${this.escapeHtml(this.timeAgo(row.created_at))}</span>`
      : "";
    return `<li><span class="name">${name}</span>${timeHtml}${linkHtml}</li>`;
  }

  timeAgo(timestamp) {
    const now = Date.now();
    const then = new Date(timestamp).getTime();
    const seconds = Math.floor((now - then) / 1000);

    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;

    const months = Math.floor(days / 30.44);
    if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;

    const years = Math.floor(days / 365.25);
    return `${years} year${years === 1 ? "" : "s"} ago`;
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
