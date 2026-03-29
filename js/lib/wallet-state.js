function getInitialNetworkMode() {
  const params = new URLSearchParams(window.location.search);
  return params.has("devnet") ? "devnet" : "mainnet";
}

const ETH_MAINNET_CHAIN_ID = "0x1";
const ETH_SEPOLIA_CHAIN_ID = "0xaa36a7";

export function getExpectedNetworks(mode) {
  if (mode === "devnet") {
    return {
      ethChainId: ETH_SEPOLIA_CHAIN_ID,
      ethName: "Sepolia",
      cardanoNetworkId: 0,
      cardanoName: "Preview",
    };
  }
  return {
    ethChainId: ETH_MAINNET_CHAIN_ID,
    ethName: "Mainnet",
    cardanoNetworkId: 1,
    cardanoName: "Mainnet",
  };
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
