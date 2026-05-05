import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { listOathEvents, verifyOathEvent, type OathEventRow } from '../api/client';
import { getInitialNetworkMode } from '../utils/network';
import { useAppDispatch } from '../store/hooks';
import { setNetworkMode } from '../store/sessionSlice';

export default function OathLogPage() {
  const location = useLocation();
  const dispatch = useAppDispatch();
  const networkMode = getInitialNetworkMode(location.search);

  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);
  const [rows, setRows] = useState<OathEventRow[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verifyingIds, setVerifyingIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    dispatch(setNetworkMode(networkMode));
  }, [dispatch, networkMode]);

  useEffect(() => {
    setPage(1);
  }, [networkMode]);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const payload = await listOathEvents({
        page,
        limit,
        networkMode,
      });
      setTotal(Number(payload.total || 0));
      setRows(Array.isArray(payload.data) ? payload.data : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load log.');
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, networkMode]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '-';
    return d.toLocaleString();
  };

  const shortHash = (value: string | null) => {
    const text = String(value || '');
    if (text.length <= 18) return text;
    return `${text.slice(0, 10)}...${text.slice(-8)}`;
  };

  const onVerify = async (id: number) => {
    setVerifyingIds((s) => new Set(s).add(id));
    setError('');
    try {
      await verifyOathEvent(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to verify this transaction.');
    } finally {
      setVerifyingIds((s) => {
        const n = new Set(s);
        n.delete(id);
        return n;
      });
      void loadPage();
    }
  };

  return (
    <div className="relative mx-auto max-w-[1060px] px-4 py-6 pb-10">
      {networkMode === 'devnet' ? (
        <div className="fixed right-3 top-3 z-[99] rounded-full bg-red-900 px-3 py-1 text-xs uppercase text-white shadow-lg">
          Devnet Mode
        </div>
      ) : null}
      <section className="som-card">
        <h1 className="text-[clamp(1.4rem,3vw,1.9rem)] text-amber-100">Oath Ceremony Log</h1>
        <p className="mt-2 text-[var(--som-text)]">Newest entries first. Unverified transactions can be retried manually.</p>
        <p className="mt-2">
          <Link to="/" className="underline">
            Back to Home
          </Link>
        </p>
        {error ? <p className="mt-2 text-red-400">{error}</p> : null}
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-left text-sm text-[var(--som-text)]">
            <thead>
              <tr className="border-b text-xs uppercase text-[var(--som-text-muted)]" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <th className="p-2">Date</th>
                <th className="p-2">Signer</th>
                <th className="p-2">Chain</th>
                <th className="p-2">Wallet</th>
                <th className="p-2">Transaction</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-2">
                    Loading...
                  </td>
                </tr>
              ) : !rows.length ? (
                <tr>
                  <td colSpan={7} className="p-2">
                    No oath events yet.
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const statusClass = row.verified_on_chain ? 'text-green-300 font-semibold' : 'text-amber-200 font-semibold';
                  const statusText = row.verified_on_chain ? 'Verified' : 'Needs verification';
                  const verifyDisabled = verifyingIds.has(row.id);
                  return (
                    <tr key={row.id} className="border-b border-white/5">
                      <td className="p-2 align-top">{formatDate(row.created_at)}</td>
                      <td className="p-2 align-top">{row.signer_name || ''}</td>
                      <td className="p-2 align-top">
                        {row.chain} ({row.network_mode})
                      </td>
                      <td className="p-2 align-top font-mono text-xs" title={row.wallet_address || ''}>
                        {shortHash(row.wallet_address)}
                      </td>
                      <td className="p-2 align-top font-mono text-xs">
                        {row.explorer_url ? (
                          <a href={row.explorer_url} target="_blank" rel="noopener noreferrer">
                            {shortHash(row.tx_hash)}
                          </a>
                        ) : (
                          shortHash(row.tx_hash)
                        )}
                      </td>
                      <td className={`p-2 align-top ${statusClass}`}>{statusText}</td>
                      <td className="p-2 align-top">
                        {row.verified_on_chain ? (
                          '-'
                        ) : (
                          <button
                            type="button"
                            className="som-btn-secondary rounded px-2 py-1 text-xs"
                            disabled={verifyDisabled}
                            onClick={() => void onVerify(row.id)}
                          >
                            {verifyDisabled ? 'Verifying...' : 'Verify'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex items-center gap-3 text-sm text-[var(--som-text-muted)]">
          <button
            type="button"
            className="som-btn-secondary rounded px-3 py-1"
            disabled={isLoading || page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages} ({total} total)
          </span>
          <button
            type="button"
            className="som-btn-secondary rounded px-3 py-1"
            disabled={isLoading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </div>
  );
}
