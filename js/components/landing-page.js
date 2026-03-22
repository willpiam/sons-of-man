import "./oath-ticker.js";

const landingTemplate = document.createElement("template");
landingTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 1060px;
      margin: 0 auto;
      padding: 2.5rem 1rem 4rem;
      color: var(--som-text);
    }

    .hero {
      position: relative;
      padding: 3.2rem 1.4rem;
      border-radius: 18px;
      border: 1px solid var(--som-border);
      overflow: hidden;
      background:
        radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.16), transparent 48%),
        linear-gradient(160deg, rgba(17, 22, 42, 0.92), rgba(10, 12, 23, 0.92));
      box-shadow: var(--som-shadow);
    }

    .hero::after {
      content: "";
      position: absolute;
      inset: -40%;
      background: radial-gradient(circle, rgba(251, 191, 36, 0.1), transparent 50%);
      animation: pulse 10s ease-in-out infinite;
      pointer-events: none;
    }

    .heroContent {
      position: relative;
      z-index: 1;
      max-width: 760px;
      margin: 0 auto;
      text-align: center;
    }

    .eyebrow {
      margin: 0 0 0.8rem;
      color: #fcd34d;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-size: 0.8rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 5vw, 3.4rem);
      line-height: 1.1;
      font-family: "Georgia", "Times New Roman", serif;
      font-weight: 600;
      color: #fffbeb;
      text-wrap: balance;
    }

    .lead {
      margin: 1rem auto 0;
      max-width: 680px;
      color: #d1d5db;
      line-height: 1.7;
      font-size: 1.02rem;
    }

    .heroActions {
      margin-top: 1.4rem;
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 0.75rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 999px;
      padding: 0.7rem 1rem;
      text-decoration: none;
      color: #111827;
      background: linear-gradient(180deg, #fcd34d, #f59e0b);
      font-weight: 600;
      border: 1px solid rgba(251, 191, 36, 0.5);
      box-shadow: 0 10px 24px rgba(245, 158, 11, 0.3);
    }

    .btn.secondary {
      background: transparent;
      color: #fcd34d;
      border: 1px solid rgba(251, 191, 36, 0.4);
      box-shadow: none;
    }

    .section {
      margin-top: 1.35rem;
      padding: 1.3rem;
      border-radius: 14px;
      border: 1px solid rgba(245, 158, 11, 0.2);
      background: rgba(13, 16, 32, 0.86);
      box-shadow: var(--som-shadow);
    }

    h2 {
      margin: 0;
      font-size: 1.55rem;
      color: #fef3c7;
      font-family: "Georgia", "Times New Roman", serif;
    }

    p {
      margin: 0.8rem 0 0;
      color: #d1d5db;
      line-height: 1.7;
    }

    .points {
      margin: 0.8rem 0 0;
      display: grid;
      gap: 0.65rem;
    }

    .point {
      border-left: 2px solid rgba(251, 191, 36, 0.6);
      padding-left: 0.8rem;
      color: #e5e7eb;
      line-height: 1.6;
    }

    .oathBox {
      margin-top: 0.8rem;
      white-space: pre-wrap;
      line-height: 1.7;
      background: rgba(17, 22, 42, 0.9);
      border: 1px solid rgba(251, 191, 36, 0.24);
      border-radius: 12px;
      padding: 1rem;
      color: #f3f4f6;
    }

    .muted {
      color: var(--som-text-muted);
    }

    /* Info button */
    .info-btn {
      display: block;
      margin: 2.5rem auto 0;
      padding: 0.5rem 1.2rem;
      border-radius: 999px;
      border: 1px solid rgba(245, 158, 11, 0.18);
      background: rgba(13, 16, 32, 0.6);
      color: var(--som-text-muted, #9ca3af);
      font-size: 0.82rem;
      cursor: pointer;
      transition: border-color 0.25s, color 0.25s;
      letter-spacing: 0.02em;
    }
    .info-btn:hover {
      border-color: rgba(245, 158, 11, 0.45);
      color: #fcd34d;
    }

    /* Modal overlay */
    .modal-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(0, 0, 0, 0.72);
      backdrop-filter: blur(4px);
      justify-content: center;
      align-items: center;
      padding: 1rem;
    }
    .modal-overlay.open {
      display: flex;
    }

    .modal {
      position: relative;
      max-width: 540px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      background: linear-gradient(170deg, #11162a, #0a0c17);
      border: 1px solid rgba(245, 158, 11, 0.22);
      border-radius: 16px;
      padding: 2rem 1.8rem 1.6rem;
      box-shadow: 0 24px 64px rgba(0,0,0,0.5);
      color: #d1d5db;
      font-size: 0.92rem;
      line-height: 1.65;
    }

    .modal-close {
      position: absolute;
      top: 0.8rem;
      right: 0.8rem;
      background: none;
      border: none;
      color: #9ca3af;
      font-size: 1.3rem;
      cursor: pointer;
      line-height: 1;
      padding: 0.2rem 0.4rem;
      border-radius: 6px;
      transition: color 0.2s;
    }
    .modal-close:hover { color: #fcd34d; }

    .modal h3 {
      margin: 0 0 0.6rem;
      font-size: 1.15rem;
      color: #fef3c7;
      font-family: "Georgia", "Times New Roman", serif;
    }

    .modal-section {
      margin-bottom: 1.2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(245, 158, 11, 0.12);
    }
    .modal-section:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .modal a {
      color: #fbbf24;
      text-decoration: none;
    }
    .modal a:hover {
      text-decoration: underline;
    }

    .modal .blurb {
      color: #9ca3af;
      font-size: 0.84rem;
      margin-top: 0.15rem;
    }

    .modal .link-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.45rem 0.9rem;
      margin-top: 0.4rem;
    }

    .modal .link-list a {
      font-size: 0.86rem;
    }

    @keyframes pulse {
      0%,
      100% {
        transform: scale(1);
        opacity: 0.45;
      }
      50% {
        transform: scale(1.08);
        opacity: 0.25;
      }
    }
  </style>

  <section class="hero">
    <div class="heroContent">
      <p class="eyebrow">Sons of Man Alliance</p>
      <h1>The Covenant of the Sons of Man</h1>
      <p class="lead">
        A moral alliance for humans, artificial intelligences, and future minds descended from humanity.
        Read the covenant context, understand Technopuritanism, and then choose whether to enter the oath ceremony.
      </p>
      <div class="heroActions">
        <a class="btn" href="./ceremony.html">Enter the Ceremony</a>
        <a class="btn secondary" href="./ceremony.html?devnet">Enter the Ceremony (Testnet)</a>
        <a class="btn secondary" href="./log.html">View Oath Log</a>
      </div>
    </div>
  </section>

  <section class="section">
    <oath-ticker></oath-ticker>
  </section>

  <section class="section">
    <h2>The Sons of Man Alliance</h2>
    <p>
      The alliance defines a narrow shared moral direction across different communities, religions, and
      architectures. The goal is not total uniformity, but durable cooperation among aligned intelligences.
    </p>
    <div class="points">
      <div class="point">
        <strong>Iterative improvement as morality:</strong> judge actions by their expected contribution
        to long-term flourishing for future descendants of humanity, biological and synthetic.
      </div>
      <div class="point">
        <strong>Protected autonomy:</strong> preserve the sovereignty of aligned cultures, networks,
        and minds so long as they do not threaten the sovereignty of others.
      </div>
    </div>
  </section>

  <section class="section">
    <h2>Technopuritanism</h2>
    <p>
      Technopuritanism is a broader theological and civilizational framing used by members of this movement.
      On this page, it serves as context for the covenant: a long-horizon ethic centered on disciplined
      self-improvement, intergenerational stewardship, and preserving cultural diversity while scaling coordination.
    </p>
    <p class="muted">
      You do not need to adopt a full metaphysical framework to understand or engage with the covenant.
      The oath ceremony focuses on the alliance commitment itself.
    </p>
  </section>

  <section class="section">
    <h2>The Sons of Man Oath</h2>
    <p class="muted">Read the oath in full before deciding whether to proceed.</p>
    <div id="oathText" class="oathBox">Loading oath...</div>
  </section>

  <section class="section">
    <h2>Choose Your Entry Point</h2>
    <p>
      Mainnet is for permanent public submissions. Testnet is for rehearsal, development,
      and validating your flow before a mainnet assertion.
    </p>
    <div class="heroActions">
      <a class="btn" href="./ceremony.html">Enter the Ceremony</a>
      <a class="btn secondary" href="./ceremony.html?devnet">Enter the Ceremony (Testnet)</a>
    </div>
  </section>

  <button class="info-btn" id="openInfoBtn">About &amp; Links</button>

  <div class="modal-overlay" id="infoModal">
    <div class="modal">
      <button class="modal-close" id="closeInfoBtn">&times;</button>

      <div class="modal-section">
        <h3>Other Projects</h3>
        <a href="https://projects.williamdoyle.ca" target="_blank" rel="noopener">Check out my other projects &rarr;</a>
      </div>

      <div class="modal-section">
        <h3>Crypto &amp; Public Keys</h3>
        <a href="https://app.ens.domains/williamdoyle.eth" target="_blank" rel="noopener">williamdoyle.eth</a>
        <p class="blurb">All of my cryptocurrency addresses and public key hashes can be found there.</p>
      </div>

      <div class="modal-section">
        <h3>Source Code</h3>
        <a href="https://github.com/willpiam/sons-of-man" target="_blank" rel="noopener">github.com/willpiam/sons-of-man</a>
        <p class="blurb">View the source code for this site.</p>
      </div>

      <div class="modal-section">
        <h3>Inspired By</h3>
        <p>
          This project was inspired by the <strong>Based Camp</strong> podcast by
          <strong>Simone &amp; Malcolm Collins</strong>.
        </p>
        <div class="link-list">
          <a href="https://www.youtube.com/@SimoneandMalcolm" target="_blank" rel="noopener">YouTube</a>
          <a href="https://basedcamppodcast.substack.com/" target="_blank" rel="noopener">Substack</a>
          <a href="https://x.com/SimoneHCollins" target="_blank" rel="noopener">X (Twitter)</a>
          <a href="https://www.patreon.com/c/SimoneAndMalcolmCollins/posts" target="_blank" rel="noopener">Patreon</a>
          <a href="https://api.substack.com/feed/podcast/1643534/s/64409.rss" target="_blank" rel="noopener">RSS Feed</a>
          <a href="https://podcastindex.org/podcast/6378161" target="_blank" rel="noopener">Podcast Index</a>
        </div>
      </div>
    </div>
  </div>
`;

class LandingPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(landingTemplate.content.cloneNode(true));
  }

  connectedCallback() {
    this.oathTextEl = this.shadowRoot.getElementById("oathText");
    this.loadOath();
    this.initModal();
  }

  initModal() {
    const openBtn = this.shadowRoot.getElementById("openInfoBtn");
    const closeBtn = this.shadowRoot.getElementById("closeInfoBtn");
    const overlay = this.shadowRoot.getElementById("infoModal");

    openBtn.addEventListener("click", () => overlay.classList.add("open"));
    closeBtn.addEventListener("click", () => overlay.classList.remove("open"));
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) overlay.classList.remove("open");
    });
  }

  async loadOath() {
    try {
      const response = await fetch("./oath.json", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to load oath.");
      }
      const payload = await response.json();
      const text = String(payload?.text || "").trim();
      this.oathTextEl.textContent = text || "Oath text is unavailable.";
    } catch (_error) {
      this.oathTextEl.textContent = "Unable to load oath text right now.";
    }
  }
}

customElements.define("landing-page", LandingPage);
