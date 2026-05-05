import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCardanoWallet } from '../store/sessionSlice';
import { createLucidWithCip30Wallet } from '../functions/cardanoOathTx';
import { getExpectedNetworks } from '../utils/network';
import type { NetworkMode } from '../utils/network';
import type { CardanoCip30Api } from '../types/cip30';

export type CardanoSession = { api: CardanoCip30Api; lucid: unknown; walletName: string };

export function CardanoWalletPanel({
  networkMode,
  onSession,
}: {
  networkMode: NetworkMode;
  onSession: (session: CardanoSession | null) => void;
}) {
  const cardanoAddress = useAppSelector((s) => s.session.cardano.address);
  const appDispatch = useAppDispatch();
  const [error, setError] = useState('');
  const [networkWarning, setNetworkWarning] = useState('');

  const getWalletProviders = (): [string, { enable?: () => Promise<unknown> }][] => {
    if (!window.cardano) {
      return [];
    }
    return Object.entries(window.cardano).filter(
      ([, w]) => w && typeof w.enable === 'function',
    ) as [string, { enable?: () => Promise<unknown> }][];
  };

  const checkNetworkMismatch = (networkId: number) => {
    const expected = getExpectedNetworks(networkMode);
    if (networkId !== expected.cardanoNetworkId) {
      const walletNetwork = networkId === 1 ? 'Mainnet' : 'Preview/Testnet';
      setNetworkWarning(
        `Network mismatch: Your wallet is connected to ${walletNetwork}, but this site is in ${
          networkMode === 'devnet' ? 'Devnet' : 'Mainnet'
        } mode. Please switch to ${expected.cardanoName} to continue.`,
      );
      return true;
    }
    setNetworkWarning('');
    return false;
  };

  const connectWallet = async (walletName: string) => {
    setError('');
    setNetworkWarning('');
    onSession(null);
    const wallet = window.cardano?.[walletName];
    if (!wallet?.enable) {
      setError('Selected wallet provider is not available.');
      return;
    }
    try {
      const api = (await wallet.enable()) as CardanoCip30Api;
      const networkId = await api.getNetworkId();
      const mismatch = checkNetworkMismatch(networkId);
      if (mismatch) {
        appDispatch(
          setCardanoWallet({ connected: false, address: '', selectedWallet: walletName }),
        );
        return;
      }
      const lucid = await createLucidWithCip30Wallet(api, networkMode);
      const address = await lucid.wallet().address();
      appDispatch(
        setCardanoWallet({ connected: true, address, selectedWallet: walletName }),
      );
      onSession({ api, lucid, walletName });
    } catch (e: unknown) {
      appDispatch(
        setCardanoWallet({ connected: false, address: '', selectedWallet: null }),
      );
      onSession(null);
      setError(e instanceof Error ? e.message : 'Failed to connect Cardano wallet.');
    }
  };

  const providers = getWalletProviders();
  if (providers.length === 0) {
    return (
      <section
        className="rounded-[10px] border p-4"
        style={{ borderColor: 'var(--som-border)', background: 'rgba(6, 6, 15, 0.5)' }}
      >
        <h2 className="mb-3 text-lg" style={{ color: 'var(--som-text)' }}>
          Cardano Wallet
        </h2>
        <p className="text-sm text-red-400">No Cardano wallet providers found (Nami, Lace, Eternl, etc.).</p>
      </section>
    );
  }

  return (
    <section
      className="rounded-[10px] border p-4"
      style={{ borderColor: 'var(--som-border)', background: 'rgba(6, 6, 15, 0.5)' }}
    >
      <h2 className="mb-3 text-lg" style={{ color: 'var(--som-text)' }}>
        Cardano Wallet
      </h2>
      <div className="mb-2 flex flex-wrap gap-2">
        {providers.map(([name]) => (
          <button
            key={name}
            type="button"
            className="cursor-pointer rounded-[10px] border px-3 py-2 text-sm font-semibold"
            style={{
              borderColor: 'var(--som-border)',
              background: 'rgba(245, 158, 11, 0.15)',
              color: 'var(--som-accent-strong)',
            }}
            onClick={() => connectWallet(name)}
          >
            Connect {name}
          </button>
        ))}
      </div>
      {cardanoAddress ? (
        <output
          className="mt-3 block rounded-lg border p-2 font-mono text-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--som-text)',
          }}
        >
          Address: {cardanoAddress}
        </output>
      ) : null}
      {networkWarning ? (
        <p className="mt-3 rounded-lg border border-red-400/40 bg-red-900/25 p-3 text-sm text-red-200">
          {networkWarning}
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </section>
  );
}
