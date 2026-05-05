import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { listOathEvents, type OathEventRow } from '../api/client';

function escapeHtml(value: string) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function timeAgo(timestamp: string) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;

  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;

  const years = Math.floor(days / 365.25);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function OathTicker() {
  const [rows, setRows] = useState<OathEventRow[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await listOathEvents({
          page: 1,
          limit: 11,
          networkMode: 'all',
        });
        const data = Array.isArray(payload?.data) ? payload.data : [];
        if (!cancelled) {
          setRows(data.length ? data : []);
        }
      } catch {
        if (!cancelled) setRows([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (rows === null) {
    return (
      <div className="text-sm text-[var(--som-text-muted)]">Loading recent oaths...</div>
    );
  }

  if (!rows.length) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-[14px] border shadow-lg" style={{ borderColor: 'var(--som-border)' }}>
      <div className="border-b px-4 py-2 text-xs uppercase tracking-wider text-[var(--som-text-muted)]" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
        Recent Oaths
      </div>
      <ul className="m-0 list-none p-0">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex items-center justify-between gap-2 border-b px-4 py-2 text-sm last:border-b-0"
            style={{ borderColor: 'rgba(255, 255, 255, 0.04)' }}
          >
            <span className="min-w-0 flex-1 truncate text-[var(--som-text)]">
              {escapeHtml(row.signer_name || 'Anonymous')}
            </span>
            {row.created_at ? (
              <span className="shrink-0 text-xs text-[var(--som-text-muted)]">{timeAgo(row.created_at)}</span>
            ) : null}
            {row.explorer_url ? (
              <a
                className="shrink-0 text-xs text-amber-300"
                href={row.explorer_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                View tx
              </a>
            ) : null}
          </li>
        ))}
      </ul>
      <div className="border-t px-4 py-2 text-right text-sm" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
        <Link to="/log" className="text-amber-300">
          View full oath log &rarr;
        </Link>
      </div>
    </div>
  );
}
