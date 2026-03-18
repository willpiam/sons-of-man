export const walletState = {
  app: {
    networkMode: "mainnet",
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

export function setNetworkMode(mode) {
  if (mode !== "mainnet" && mode !== "devnet") {
    throw new Error(`Unsupported network mode: ${mode}`);
  }
  updateWalletState("app", { networkMode: mode });
}
