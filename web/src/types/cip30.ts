/** Minimal CIP-30 surface used by this app */
export interface CardanoCip30Api {
  getNetworkId: () => Promise<number>;
  getUsedAddresses: () => Promise<string[]>;
  getChangeAddress: () => Promise<string>;
  signTx: (tx: string) => Promise<string>;
  submitTx: (signedTx: string) => Promise<string>;
}
