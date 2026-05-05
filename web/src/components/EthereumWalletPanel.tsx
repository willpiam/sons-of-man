import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setEthereumWallet } from '../store/sessionSlice';
import { getExpectedNetworks } from '../utils/network';
import type { NetworkMode } from '../utils/network';

export function EthereumWalletPanel({ networkMode }: { networkMode: NetworkMode }) {
  const dispatch = useAppDispatch();
  const address = useAppSelector((s) => s.session.ethereum.address);
  const [error, setError] = useState('');
  const [networkWarning, setNetworkWarning] = useState('');

  const checkNetworkMismatch = useCallback(
    (chainId: string) => {
      const expected = getExpectedNetworks(networkMode);
      if (chainId !== expected.ethChainId) {
        const walletNetwork =
          chainId === '0x1' ? 'Mainnet' : chainId === '0xaa36a7' ? 'Sepolia' : `chain ${chainId}`;
        setNetworkWarning(
          `Network mismatch: Your wallet is on ${walletNetwork}, but this site is in ${
            networkMode === 'devnet' ? 'Devnet' : 'Mainnet'
          } mode. Please switch to ${expected.ethName} to continue.`,
        );
        return true;
      }
      setNetworkWarning('');
      return false;
    },
    [networkMode],
  );

  useEffect(() => {
    if (!window.ethereum) {
      setError('No Ethereum wallet provider found (e.g. MetaMask).');
      dispatch(setEthereumWallet({ connected: false, address: '' }));
    }
  }, [dispatch]);

  const connect = async () => {
    setError('');
    setNetworkWarning('');
    if (!window.ethereum) {
      return;
    }
    try {
      const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts?.length) {
        throw new Error('No account was returned by the wallet.');
      }
      const chainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
      const mismatch = checkNetworkMismatch(chainId);
      if (mismatch) {
        dispatch(setEthereumWallet({ connected: false, address: accounts[0] }));
      } else {
        dispatch(setEthereumWallet({ connected: true, address: accounts[0] }));
      }
    } catch (e: unknown) {
      dispatch(setEthereumWallet({ connected: false, address: '' }));
      setError(e instanceof Error ? e.message : 'Failed to connect Ethereum wallet.');
    }
  };

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return undefined;
    const onChain = (chainId: unknown) => {
      const cid = String(chainId);
      if (!address) return;
      const mismatch = checkNetworkMismatch(cid);
      if (mismatch) {
        dispatch(setEthereumWallet({ connected: false, address }));
      } else {
        dispatch(setEthereumWallet({ connected: true, address }));
      }
    };
    eth.on('chainChanged', onChain);
    return () => {
      eth.removeListener?.('chainChanged', onChain);
    };
  }, [address, checkNetworkMismatch, dispatch]);

  return (
    <section
      className="rounded-[10px] border p-4"
      style={{ borderColor: 'var(--som-border)', background: 'rgba(6, 6, 15, 0.5)' }}
    >
      <h2 className="mb-3 text-lg" style={{ color: 'var(--som-text)' }}>
        Ethereum Wallet
      </h2>
      <button type="button" className="som-btn" onClick={connect} disabled={!window.ethereum}>
        Connect Ethereum
      </button>
      {address ? (
        <output
          className="mt-3 block rounded-lg border p-2 font-mono text-sm"
          style={{
            background: 'var(--wallet-output-bg, rgba(255, 255, 255, 0.05))',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--som-text)',
          }}
        >
          Address: {address}
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
