/// <reference types="react-scripts" />

interface Window {
  SOM_API_BASE_URL?: string;
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on?: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
  };
  cardano?: Record<string, { enable?: () => Promise<unknown> } & Record<string, unknown>>;
}
