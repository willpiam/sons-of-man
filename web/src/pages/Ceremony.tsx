import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createOathEvent } from '../api/client';
import { resetCeremonyWallets, setNetworkMode } from '../store/sessionSlice';
import { CardanoWalletPanel, type CardanoSession } from '../components/CardanoWalletPanel';
import { EthereumWalletPanel } from '../components/EthereumWalletPanel';
import { getInitialNetworkMode } from '../utils/network';
import {
  buildCommitmentText,
  getExplorerUrl,
  splitForCip20,
} from '../utils/oathCommit';
import { sendCardanoCip20OathMessage } from '../functions/cardanoOathTx';
import { signEthereumOathTransaction, validateEthereumCommitmentBytes } from '../functions/ethereumOath';
import { downloadOathCertificate } from '../utils/certificatePdf';

type Step = 1 | 2 | 3 | 4 | 5;

export default function Ceremony() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const networkMode = useAppSelector((s) => s.session.networkMode);
  const eth = useAppSelector((s) => s.session.ethereum);
  const ada = useAppSelector((s) => s.session.cardano);

  const cardanoSessionRef = useRef<CardanoSession | null>(null);
  const pdfTriggeredRef = useRef(false);

  const onCardanoSession = useCallback((session: CardanoSession | null) => {
    cardanoSessionRef.current = session;
  }, []);

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [hasRead, setHasRead] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [selectedChain, setSelectedChain] = useState<'ethereum' | 'cardano' | ''>('');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState('');
  const [oathText, setOathText] = useState('');
  const [signResult, setSignResult] = useState<{
    chain: string;
    txHash: string;
    explorerUrl: string;
  } | null>(null);

  useEffect(() => {
    dispatch(setNetworkMode(getInitialNetworkMode(location.search)));
  }, [dispatch, location.search]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${process.env.PUBLIC_URL || ''}/oath.json`, { cache: 'no-store' });
        if (!r.ok) {
          throw new Error('Failed to load oath.json.');
        }
        const j = (await r.json()) as { text?: string };
        const text = String(j?.text || '').trim();
        if (!text) {
          throw new Error('oath.json does not contain valid oath text.');
        }
        setOathText(text);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load oath.');
      }
    };
    load();
  }, []);

  const showError = (message: string) => {
    if (!message) {
      setError('');
      return;
    }
    setError(message);
  };

  const submitSignedEvent = async (result: {
    chain: string;
    txHash: string;
    explorerUrl: string;
  }) => {
    const walletAddress =
      result.chain === 'ethereum' ? eth.address : ada.address;
    try {
      await createOathEvent({
        signer_name: signerName,
        chain: result.chain,
        tx_hash: result.txHash,
        wallet_address: walletAddress || null,
        network_mode: networkMode,
        explorer_url: result.explorerUrl || null,
      });
    } catch {
      /* intentional: ceremony completion should not be blocked */
    }
  };

  const signCommitment = async () => {
    if (!oathText) return;
    setIsSigning(true);
    try {
      const commitment = buildCommitmentText(oathText, signerName);
      if (selectedChain === 'ethereum') {
        validateEthereumCommitmentBytes(commitment);
        if (!eth.connected || !eth.address) {
          throw new Error('Ethereum wallet is not connected.');
        }
        const txHash = await signEthereumOathTransaction(commitment, eth.address, networkMode);
        const explorerUrl = getExplorerUrl('ethereum', networkMode, txHash);
        setSignResult({ chain: 'ethereum', txHash, explorerUrl });
        void submitSignedEvent({ chain: 'ethereum', txHash, explorerUrl });
        setIsSigning(false);
        setCurrentStep(5);
        return;
      }
      if (selectedChain === 'cardano') {
        const session = cardanoSessionRef.current;
        if (!ada.connected || !session) {
          throw new Error('Cardano wallet is not connected.');
        }
        const chunks = splitForCip20(commitment);
        const txHash = await sendCardanoCip20OathMessage(session.lucid, session.api, chunks);
        const explorerUrl = getExplorerUrl('cardano', networkMode, txHash);
        setSignResult({ chain: 'cardano', txHash, explorerUrl });
        void submitSignedEvent({ chain: 'cardano', txHash, explorerUrl });
        setIsSigning(false);
        setCurrentStep(5);
        return;
      }
      throw new Error('No chain selected.');
    } catch (e: unknown) {
      setIsSigning(false);
      showError(e instanceof Error ? e.message : 'Failed to sign and submit transaction.');
      setCurrentStep(3);
    }
  };

  const goStep = (step: Step) => {
    setError('');
    if (step === 4) {
      setCurrentStep(4);
      void signCommitment();
      return;
    }
    setCurrentStep(step);
  };

  const chainLabelForPdf = () => {
    const chainValue = signResult?.chain || '';
    const isDevnet = networkMode === 'devnet';
    if (chainValue === 'ethereum') {
      return isDevnet ? 'Ethereum (Sepolia)' : 'Ethereum';
    }
    if (chainValue === 'cardano') {
      return isDevnet ? 'Cardano (Preview)' : 'Cardano';
    }
    return chainValue;
  };

  const downloadCertificate = async () => {
    const siteUrl = window.location.href;
    const txUrl = signResult?.explorerUrl || '';
    try {
      await downloadOathCertificate({
        signerName,
        oathText,
        siteUrl,
        txUrl,
        chainLabel: chainLabelForPdf(),
        txDisplay:
          signResult?.txHash ||
          String(txUrl || '')
            .split('/')
            .pop() ||
          '',
      });
    } catch (e) {
      showError(e instanceof Error ? e.message : 'PDF generation failed.');
    }
  };

  useEffect(() => {
    if (currentStep !== 5 || !signResult || pdfTriggeredRef.current) {
      return undefined;
    }
    pdfTriggeredRef.current = true;
    const id = window.setTimeout(() => {
      void downloadCertificate();
    }, 600);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot cert download after success
  }, [currentStep, signResult]);

  const restart = () => {
    pdfTriggeredRef.current = false;
    dispatch(resetCeremonyWallets());
    cardanoSessionRef.current = null;
    setSelectedChain('');
    setSignResult(null);
    setCurrentStep(1);
    setError('');
  };

  const devnetBadge = networkMode === 'devnet';

  const walletContinueDisabled =
    selectedChain === 'ethereum' ? !eth.connected : selectedChain === 'cardano' ? !ada.connected : true;

  return (
    <div className="relative mx-auto max-w-[820px] px-4 py-6 pb-10 font-sans">
      {devnetBadge ? (
        <div className="fixed right-3 top-3 z-[99] rounded-full bg-red-900 px-3 py-1 text-xs uppercase tracking-wide text-white shadow-lg">
          Devnet Mode
        </div>
      ) : null}

      <article className="som-card">
        <h1 className="mb-1 text-[clamp(1.4rem,3vw,1.9rem)] text-amber-100">
          Sons of Man Digital Oath
        </h1>
        <p className="text-[var(--som-text)]">
          Read the oath, sign a commitment on-chain, and share your public proof.
        </p>
        <p className="mt-2">
          <Link to={`/log${window.location.search}`} className="underline">
            View Oath Log
          </Link>
        </p>
        <p className="stepTag mt-2 text-sm text-[var(--som-text-muted)]">
          Step {currentStep} of 5
        </p>

        <section className="mt-4">
          {currentStep === 1 && oathText ? (
            <div>
              <h2 className="mb-2 text-xl text-amber-100">Read the Oath</h2>
              <div
                className="min-h-[180px] whitespace-pre-wrap rounded-lg border p-4 text-[0.97rem] leading-relaxed text-[var(--som-text)]"
                style={{
                  background: 'rgba(6, 6, 15, 0.5)',
                  borderColor: 'var(--som-border)',
                }}
              >
                {oathText}
              </div>
              <div className="mt-4 grid gap-3">
                <label className="flex flex-wrap items-center gap-2">
                  <input
                    type="checkbox"
                    checked={hasRead}
                    onChange={(e) => setHasRead(e.target.checked)}
                    className="accent-amber-500"
                  />
                  <span>I have read this oath and choose to continue.</span>
                </label>
                <label className="grid max-w-lg gap-1">
                  <span>Your name</span>
                  <input
                    className="som-input"
                    type="text"
                    maxLength={120}
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Type your full name"
                  />
                </label>
                <div>
                  <button
                    type="button"
                    className="som-btn"
                    disabled={!(hasRead && signerName.trim())}
                    onClick={() => goStep(2)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          ) : null}

          {currentStep === 2 ? (
            <div>
              <h2 className="mb-2 text-xl text-amber-100">Choose Your Chain</h2>
              <p className="text-[var(--som-text)]">
                Select where you want to publish your signed commitment.
              </p>
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
                <button
                  type="button"
                  className="som-btn"
                  onClick={() => {
                    setSelectedChain('ethereum');
                    goStep(3);
                  }}
                >
                  Ethereum
                </button>
                <button
                  type="button"
                  className="som-btn"
                  onClick={() => {
                    setSelectedChain('cardano');
                    goStep(3);
                  }}
                >
                  Cardano
                </button>
              </div>
              <div className="mt-4">
                <button type="button" className="som-btn-ghost rounded px-4 py-2" onClick={() => goStep(1)}>
                  Back
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 3 ? (
            <div>
              <h2 className="mb-2 text-xl text-amber-100">
                Connect {selectedChain === 'cardano' ? 'Cardano' : 'Ethereum'} Wallet
              </h2>
              <p className="mb-4 text-[var(--som-text)]">
                Connect your wallet on the required network, then continue to sign.
              </p>
              {selectedChain === 'ethereum' ? (
                <EthereumWalletPanel networkMode={networkMode} />
              ) : (
                <CardanoWalletPanel networkMode={networkMode} onSession={onCardanoSession} />
              )}
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="som-btn"
                  disabled={walletContinueDisabled}
                  onClick={() => goStep(4)}
                >
                  Continue to Sign
                </button>
                <button type="button" className="som-btn-ghost rounded px-4 py-2" onClick={() => goStep(2)}>
                  Back
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 4 ? (
            <div>
              <h2 className="mb-2 text-xl text-amber-100">Sign and Submit</h2>
              <p className="text-[var(--som-text)]">
                {isSigning
                  ? `Awaiting wallet confirmation and broadcasting to ${
                      selectedChain === 'cardano' ? 'Cardano' : 'Ethereum'
                    }...`
                  : 'Preparing signature...'}
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  className="som-btn-ghost rounded px-4 py-2"
                  disabled={isSigning}
                  onClick={() => goStep(3)}
                >
                  Back
                </button>
              </div>
            </div>
          ) : null}

          {currentStep === 5 && signResult ? (
            <div>
              <h2 className="mb-2 text-xl text-amber-100">Commitment Submitted</h2>
              <div
                className="my-4 rounded-lg border border-green-500/25 bg-green-500/10 p-4"
                style={{ overflowWrap: 'anywhere' }}
              >
                <p className="text-green-200">
                  <strong>Chain:</strong> {signResult.chain}
                </p>
                <p className="text-green-200">
                  <strong>Transaction:</strong> {signResult.txHash}
                </p>
                <p>
                  <a href={signResult.explorerUrl} target="_blank" rel="noopener noreferrer">
                    View transaction in explorer
                  </a>
                </p>
              </div>
              <p className="text-[var(--som-text)]">
                Share your transaction and this site on social media to spread the oath.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  className="rounded border border-amber-500/30 px-3 py-2 text-sm"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                    `I signed the Sons of Man digital oath on-chain. Verify here: ${signResult.explorerUrl} and take it yourself at ${window.location.href}`,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on X
                </a>
                <a
                  className="rounded border border-amber-500/30 px-3 py-2 text-sm"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on Facebook
                </a>
                <a
                  className="rounded border border-amber-500/30 px-3 py-2 text-sm"
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                    window.location.href,
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Share on LinkedIn
                </a>
                <Link to={`/log${window.location.search}`}>View Oath Log</Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="som-btn-secondary rounded px-4 py-2"
                  onClick={() => navigator.clipboard.writeText(signResult.explorerUrl)}
                >
                  Copy Tx Link
                </button>
                <button type="button" className="som-btn" onClick={() => void downloadCertificate()}>
                  Download Certificate (PDF)
                </button>
                <button type="button" className="som-btn-ghost rounded px-4 py-2" onClick={restart}>
                  Start Again
                </button>
              </div>
            </div>
          ) : null}
        </section>

        {error ? <p className="mt-4 text-red-400">{error}</p> : null}
      </article>
    </div>
  );
}
