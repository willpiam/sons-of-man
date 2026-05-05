function getConfiguredBaseUrl(): string {
  if (typeof window !== 'undefined' && typeof window.SOM_API_BASE_URL === 'string') {
    const configured = window.SOM_API_BASE_URL.trim().replace(/\/+$/, '');
    if (configured) return configured;
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ) {
    return 'http://localhost:3000/api';
  }
  return 'https://sons-of-man.onrender.com/api';
}

export const API_BASE_URL = getConfiguredBaseUrl();

async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let payload: Record<string, unknown> = {};
  if (text) {
    try {
      payload = JSON.parse(text) as Record<string, unknown>;
    } catch {
      const contentType = response.headers.get('content-type') || 'unknown content type';
      throw new Error(`API returned non-JSON response (${response.status}, ${contentType}).`);
    }
  }
  if (!response.ok) {
    throw new Error((payload.error as string) || 'API request failed.');
  }
  return payload as T;
}

export interface OathEventRow {
  id: number;
  signer_name: string;
  chain: string;
  tx_hash: string;
  wallet_address: string | null;
  network_mode: string;
  explorer_url: string | null;
  verified_on_chain: boolean;
  created_at: string;
}

export interface ListOathEventsResult {
  data: OathEventRow[];
  total: number;
}

export async function createOathEvent(body: Record<string, unknown>) {
  return requestJson('/oath-events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function listOathEvents({
  page = 1,
  limit = 20,
  networkMode = 'mainnet',
}: {
  page?: number;
  limit?: number;
  networkMode?: 'mainnet' | 'devnet' | 'all' | string;
} = {}) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    network_mode: String(networkMode),
  });
  return requestJson<ListOathEventsResult>(`/oath-events?${params.toString()}`);
}

export async function verifyOathEvent(id: number) {
  return requestJson(`/oath-events/${id}/verify`, {
    method: 'POST',
  });
}
