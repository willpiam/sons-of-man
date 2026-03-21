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
