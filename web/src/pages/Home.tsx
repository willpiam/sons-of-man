import { Link } from 'react-router';
import { useEffect, useState } from 'react';
import { OathTicker } from '../components/OathTicker';

export default function Home() {
  const [oathText, setOathText] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${process.env.PUBLIC_URL || ''}/oath.json`, { cache: 'no-store' });
        if (!r.ok) throw new Error('Failed');
        const j = (await r.json()) as { text?: string };
        setOathText(String(j?.text || '').trim() || 'Oath text is unavailable.');
      } catch {
        setOathText('Unable to load oath text right now.');
      }
    };
    load();
  }, []);

  return (
    <div className="mx-auto max-w-[1060px] px-4 pb-16 pt-10 text-[var(--som-text)]">
      <section
        className="relative overflow-hidden rounded-[18px] border px-6 py-12 text-center shadow-xl"
        style={{
          borderColor: 'var(--som-border)',
          background:
            'radial-gradient(circle at 50% 0%, rgba(245, 158, 11, 0.16), transparent 48%), linear-gradient(160deg, rgba(17, 22, 42, 0.92), rgba(10, 12, 23, 0.92))',
        }}
      >
        <p className="mb-2 text-xs uppercase tracking-widest text-amber-200">Sons of Man Alliance</p>
        <h1 className="mb-4 font-serif text-[clamp(2rem,5vw,3.4rem)] font-semibold leading-tight text-amber-50">
          The Covenant of the Sons of Man
        </h1>
        <p className="mx-auto max-w-[680px] text-lg leading-relaxed text-gray-300">
          A moral alliance for humans, artificial intelligences, and future minds descended from humanity. Read the
          covenant context, understand Technopuritanism, and then choose whether to enter the oath ceremony.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/ceremony"
            className="inline-flex rounded-full border border-amber-300/50 bg-gradient-to-b from-amber-200 to-amber-500 px-4 py-2 font-semibold text-gray-900 shadow-lg"
          >
            Enter the Ceremony
          </Link>
          <Link
            to="/ceremony?devnet"
            className="inline-flex rounded-full border border-amber-300/40 px-4 py-2 font-semibold text-amber-200"
          >
            Enter the Ceremony (Testnet)
          </Link>
          <Link to="/log" className="inline-flex rounded-full border border-amber-300/40 px-4 py-2 font-semibold text-amber-200">
            View Oath Log
          </Link>
        </div>
      </section>

      <section
        className="som-card mt-6"
      >
        <OathTicker />
      </section>

      <section className="som-card mt-6">
        <h2 className="font-serif text-2xl text-amber-100">The Sons of Man Alliance</h2>
        <p className="mt-3 leading-relaxed text-gray-300">
          The alliance defines a narrow shared moral direction across different communities, religions, and
          architectures. The goal is not total uniformity, but durable cooperation among aligned intelligences.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="border-l-2 border-amber-300/60 pl-3 text-gray-200">
            <strong>Iterative improvement as morality:</strong> judge actions by their expected contribution to
            long-term flourishing for future descendants of humanity, biological and synthetic.
          </div>
          <div className="border-l-2 border-amber-300/60 pl-3 text-gray-200">
            <strong>Protected autonomy:</strong> preserve the sovereignty of aligned cultures, networks, and minds so
            long as they do not threaten the sovereignty of others.
          </div>
        </div>
      </section>

      <section className="som-card mt-6">
        <h2 className="font-serif text-2xl text-amber-100">Technopuritanism</h2>
        <p className="mt-3 leading-relaxed text-gray-300">
          Technopuritanism is a broader theological and civilizational framing used by members of this movement. On
          this page, it serves as context for the covenant: a long-horizon ethic centered on disciplined
          self-improvement, intergenerational stewardship, and preserving cultural diversity while scaling
          coordination.
        </p>
        <p className="mt-2 text-sm text-[var(--som-text-muted)]">
          You do not need to adopt a full metaphysical framework to understand or engage with the covenant. The oath
          ceremony focuses on the alliance commitment itself.
        </p>
      </section>

      <section className="som-card mt-6">
        <h2 className="font-serif text-2xl text-amber-100">How It Works</h2>
        <p className="mt-3 leading-relaxed text-gray-300">
          When you take this oath you write it directly onto a public blockchain. Blockchains are append-only ledgers
          maintained by thousands of independent nodes worldwide. Data written to them is, for all practical purposes,{' '}
          <strong>permanent</strong>.
        </p>
        <p className="mt-3 leading-relaxed text-gray-300">
          <strong>This is not an NFT.</strong> There is no token, no asset, nothing to buy or sell. Think of it more
          like a piece of graffiti carved into an ever growing wall where you can only write to the section of wall
          currently being constructed.
        </p>
        <div className="mt-4 grid gap-3">
          <div className="border-l-2 border-amber-300/60 pl-3 text-gray-200">
            <strong>Ethereum —</strong> A 0-value transaction is sent to the traditional burn address{' '}
            <code className="text-amber-300">0x000...dEaD</code> with your oath encoded in the transaction input data
            (an IDM). The text is permanently readable by anyone on-chain.
          </div>
          <div className="border-l-2 border-amber-300/60 pl-3 text-gray-200">
            <strong>Cardano —</strong> Your oath is embedded via{' '}
            <a href="https://cips.cardano.org/cip/CIP-20" target="_blank" rel="noopener noreferrer">
              CIP-20
            </a>{' '}
            transaction metadata in a self-transaction (you send to yourself). The message is permanently inscribed in
            the transaction metadata on-chain.
          </div>
        </div>
        <p className="mt-3 text-sm text-[var(--som-text-muted)]">
          Both networks were chosen because they are well-established, decentralised, and well-suited to carrying small
          pieces of text permanently. No fee is charged beyond the network own transaction cost.
        </p>
      </section>

      <section className="som-card mt-6">
        <h2 className="font-serif text-2xl text-amber-100">The Sons of Man Oath</h2>
        <p className="mt-1 text-sm text-[var(--som-text-muted)]">Read the oath in full before deciding whether to proceed.</p>
        <div
          className="mt-3 whitespace-pre-wrap rounded-xl border p-4 leading-relaxed text-gray-100"
          style={{ background: 'rgba(17, 22, 42, 0.9)', borderColor: 'rgba(251, 191, 36, 0.24)' }}
        >
          {oathText || 'Loading oath...'}
        </div>
      </section>

      <section className="som-card mt-6">
        <h2 className="font-serif text-2xl text-amber-100">Choose Your Entry Point</h2>
        <p className="mt-3 text-gray-300">
          Mainnet is for permanent public submissions. Testnet is for rehearsal, development, and validating your flow
          before a mainnet assertion.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <Link
            to="/ceremony"
            className="inline-flex rounded-full border border-amber-300/50 bg-gradient-to-b from-amber-200 to-amber-500 px-4 py-2 font-semibold text-gray-900"
          >
            Enter the Ceremony
          </Link>
          <Link
            to="/ceremony?devnet"
            className="inline-flex rounded-full border border-amber-300/40 px-4 py-2 font-semibold text-amber-200"
          >
            Enter the Ceremony (Testnet)
          </Link>
        </div>
      </section>

      <button
        type="button"
        className="mx-auto mt-10 block cursor-pointer rounded-full border border-amber-500/20 bg-[rgba(13,16,32,0.6)] px-4 py-2 text-sm text-gray-400"
        onClick={() => setModalOpen(true)}
      >
        About &amp; Links
      </button>

      {modalOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
          onKeyDown={(e) => e.key === 'Escape' && setModalOpen(false)}
          role="presentation"
        >
          <div
            className="max-h-[85vh] max-w-lg overflow-y-auto rounded-2xl border p-8 text-sm leading-relaxed text-gray-300"
            style={{
              background: 'linear-gradient(170deg, #11162a, #0a0c17)',
              borderColor: 'rgba(245, 158, 11, 0.22)',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal
          >
            <button
              type="button"
              className="float-right text-2xl text-gray-400 hover:text-amber-300"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <div className="mb-4 border-b border-amber-500/10 pb-4">
              <h3 className="font-serif text-lg text-amber-100">Other Projects</h3>
              <a href="https://projects.williamdoyle.ca" target="_blank" rel="noopener noreferrer" className="text-amber-300">
                Check out my other projects &rarr;
              </a>
            </div>
            <div className="mb-4 border-b border-amber-500/10 pb-4">
              <h3 className="font-serif text-lg text-amber-100">Crypto &amp; Public Keys</h3>
              <a href="https://app.ens.domains/williamdoyle.eth" target="_blank" rel="noopener noreferrer" className="text-amber-300">
                williamdoyle.eth
              </a>
              <p className="mt-1 text-xs text-gray-500">All of my cryptocurrency addresses and public key hashes can be found there.</p>
            </div>
            <div className="mb-4 border-b border-amber-500/10 pb-4">
              <h3 className="font-serif text-lg text-amber-100">Source Code</h3>
              <a href="https://github.com/willpiam/sons-of-man" target="_blank" rel="noopener noreferrer" className="text-amber-300">
                github.com/willpiam/sons-of-man
              </a>
            </div>
            <div>
              <h3 className="font-serif text-lg text-amber-100">Inspired By</h3>
              <p className="mt-2 text-gray-300">
                This project was inspired by the <strong>Based Camp</strong> podcast by <strong>Simone &amp; Malcolm Collins</strong>.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-amber-300/90">
                <a href="https://www.youtube.com/@SimoneandMalcolm" target="_blank" rel="noopener noreferrer">YouTube</a>
                <a href="https://basedcamppodcast.substack.com/" target="_blank" rel="noopener noreferrer">Substack</a>
                <a href="https://x.com/SimoneHCollins" target="_blank" rel="noopener noreferrer">X</a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
