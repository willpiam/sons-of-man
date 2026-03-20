import { listOathEvents, verifyOathEvent } from "../lib/api.js";

const oathLogTemplate = document.createElement("template");
oathLogTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 980px;
      margin: 0 auto;
      padding: 1.5rem 1rem 2.5rem;
      font-family: "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }

    .card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.1rem;
      box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
    }

    h1 {
      margin: 0;
      color: #0f172a;
      font-size: clamp(1.4rem, 3vw, 1.9rem);
    }

    p {
      color: #334155;
      margin: 0.45rem 0;
      line-height: 1.5;
    }

    a {
      color: #1d4ed8;
    }

    .error {
      color: #b91c1c;
      margin-top: 0.7rem;
    }

    .tableWrap {
      overflow-x: auto;
      margin-top: 0.8rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 780px;
    }

    th,
    td {
      padding: 0.6rem;
      border-bottom: 1px solid #e2e8f0;
      text-align: left;
      vertical-align: top;
      color: #0f172a;
      font-size: 0.95rem;
    }

    th {
      color: #475569;
      font-weight: 600;
      font-size: 0.88rem;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
      overflow-wrap: anywhere;
    }

    .statusOk {
      color: #166534;
      font-weight: 600;
    }

    .statusWarn {
      color: #b45309;
      font-weight: 600;
    }

    button {
      border: 0;
      border-radius: 8px;
      padding: 0.45rem 0.75rem;
      font: inherit;
      cursor: pointer;
      color: #ffffff;
      background: #4f46e5;
    }

    button.secondary {
      background: #475569;
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .pager {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-top: 0.8rem;
    }
  </style>

  <section class="card">
    <h1>Oath Ceremony Log</h1>
    <p>Newest entries first. Unverified transactions can be retried manually.</p>
    <p><a id="backLink" href="./index.html">Back to Ceremony</a></p>
    <p id="errorText" class="error" hidden></p>
    <div class="tableWrap">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Signer</th>
            <th>Chain</th>
            <th>Wallet</th>
            <th>Transaction</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody id="rows"></tbody>
      </table>
    </div>
    <div class="pager">
      <button id="prevBtn" class="secondary" type="button">Previous</button>
      <span id="pageInfo"></span>
      <button id="nextBtn" class="secondary" type="button">Next</button>
    </div>
  </section>
`;

class OathLog extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(oathLogTemplate.content.cloneNode(true));
    this.page = 1;
    this.limit = 20;
    this.total = 0;
    this.isLoading = false;
    this.verifyingIds = new Set();
    this.networkMode = new URLSearchParams(window.location.search).has("devnet")
      ? "devnet"
      : "mainnet";
  }

  connectedCallback() {
    this.rowsEl = this.shadowRoot.getElementById("rows");
    this.errorText = this.shadowRoot.getElementById("errorText");
    this.prevBtn = this.shadowRoot.getElementById("prevBtn");
    this.nextBtn = this.shadowRoot.getElementById("nextBtn");
    this.pageInfo = this.shadowRoot.getElementById("pageInfo");

    this.shadowRoot.getElementById("backLink").href = "./index.html" + window.location.search;

    this.prevBtn.addEventListener("click", () => {
      if (this.page > 1) {
        this.page -= 1;
        this.loadPage();
      }
    });
    this.nextBtn.addEventListener("click", () => {
      if (this.page < this.totalPages) {
        this.page += 1;
        this.loadPage();
      }
    });

    this.loadPage();
  }

  get totalPages() {
    return Math.max(1, Math.ceil(this.total / this.limit));
  }

  showError(message) {
    this.errorText.hidden = !message;
    this.errorText.textContent = message || "";
  }

  async loadPage() {
    this.isLoading = true;
    this.syncPager();
    this.rowsEl.innerHTML = `<tr><td colspan="7">Loading...</td></tr>`;
    this.showError("");

    try {
      const payload = await listOathEvents({
        page: this.page,
        limit: this.limit,
        networkMode: this.networkMode,
      });
      this.total = Number(payload.total || 0);
      this.renderRows(payload.data || []);
    } catch (error) {
      this.rowsEl.innerHTML = `<tr><td colspan="7">Unable to load log entries.</td></tr>`;
      this.showError(error?.message || "Failed to load log.");
    } finally {
      this.isLoading = false;
      this.syncPager();
    }
  }

  syncPager() {
    this.pageInfo.textContent = `Page ${this.page} of ${this.totalPages} (${this.total} total)`;
    this.prevBtn.disabled = this.isLoading || this.page <= 1;
    this.nextBtn.disabled = this.isLoading || this.page >= this.totalPages;
  }

  formatDate(isoValue) {
    const date = new Date(isoValue);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleString();
  }

  shortHash(value) {
    const text = String(value || "");
    if (text.length <= 18) {
      return text;
    }
    return `${text.slice(0, 10)}...${text.slice(-8)}`;
  }

  renderRows(rows) {
    if (!rows.length) {
      this.rowsEl.innerHTML = `<tr><td colspan="7">No oath events yet.</td></tr>`;
      return;
    }

    this.rowsEl.innerHTML = rows
      .map((row) => {
        const statusClass = row.verified_on_chain ? "statusOk" : "statusWarn";
        const statusText = row.verified_on_chain ? "Verified" : "Needs verification";
        const verifyDisabled = this.verifyingIds.has(row.id);
        const wallet = row.wallet_address || "-";
        const txLabel = this.shortHash(row.tx_hash);
        const txLink = row.explorer_url
          ? `<a class="mono" href="${this.escapeHtml(row.explorer_url)}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(txLabel)}</a>`
          : `<span class="mono">${this.escapeHtml(txLabel)}</span>`;
        const actionCell = row.verified_on_chain
          ? "-"
          : `<button data-verify-id="${row.id}" type="button" ${verifyDisabled ? "disabled" : ""}>${verifyDisabled ? "Verifying..." : "Verify"}</button>`;

        return `
          <tr>
            <td>${this.escapeHtml(this.formatDate(row.created_at))}</td>
            <td>${this.escapeHtml(row.signer_name || "")}</td>
            <td>${this.escapeHtml(row.chain || "")} (${this.escapeHtml(row.network_mode || "")})</td>
            <td class="mono">${this.escapeHtml(wallet)}</td>
            <td>${txLink}</td>
            <td class="${statusClass}">${statusText}</td>
            <td>${actionCell}</td>
          </tr>
        `;
      })
      .join("");

    this.rowsEl.querySelectorAll("[data-verify-id]").forEach((button) => {
      button.addEventListener("click", async () => {
        const id = Number.parseInt(button.getAttribute("data-verify-id"), 10);
        if (!Number.isInteger(id)) {
          return;
        }
        await this.retryVerify(id);
      });
    });
  }

  async retryVerify(id) {
    this.verifyingIds.add(id);
    this.loadPage();
    try {
      await verifyOathEvent(id);
      this.showError("");
    } catch (error) {
      this.showError(error?.message || "Failed to verify this transaction.");
    } finally {
      this.verifyingIds.delete(id);
      this.loadPage();
    }
  }

  escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
}

customElements.define("oath-log", OathLog);
