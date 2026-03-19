function getInitialNetworkMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has("devnet") ? "devnet" : "mainnet";
}

export const walletState = {
  app: {
    networkMode: getInitialNetworkMode(),
  },
  ethereum: {
    connected: false,
    address: "",
  },
  cardano: {
    connected: false,
    address: "",
    api: null,
  },
};

export function updateWalletState(chain, nextState) {
  if (!walletState[chain]) {
    throw new Error(`Unknown wallet state chain: ${chain}`);
  }

  walletState[chain] = { ...walletState[chain], ...nextState };
  window.dispatchEvent(
    new CustomEvent("wallet-state-changed", {
      detail: { chain, state: walletState[chain] },
    }),
  );
}
