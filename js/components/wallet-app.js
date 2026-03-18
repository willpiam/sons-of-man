import "./ethereum-wallet.js";
import "./cardano-wallet.js";
import "./message-sender.js";
import "./network-toggle.js";

const appTemplate = document.createElement("template");
appTemplate.innerHTML = `
  <style>
    :host {
      display: block;
      max-width: 860px;
      margin: 2.5rem auto;
      padding: 0 1rem 2rem;
    }

    header {
      margin-bottom: 1.25rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.5rem, 3vw, 2rem);
      color: #111827;
    }

    p {
      margin: 0.5rem 0 0;
      color: #374151;
    }

    main {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
      align-items: start;
    }
  </style>

  <article>
    <header>
      <h1>Wallet Connector</h1>
      <p>Connect your Ethereum and Cardano wallets to view your addresses.</p>
    </header>
    <network-toggle></network-toggle>
    <main>
      <ethereum-wallet></ethereum-wallet>
      <cardano-wallet></cardano-wallet>
    </main>
    <message-sender></message-sender>
  </article>
`;

class WalletApp extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot.append(appTemplate.content.cloneNode(true));
  }
}

customElements.define("wallet-app", WalletApp);
