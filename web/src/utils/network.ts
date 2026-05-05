export type NetworkMode = 'mainnet' | 'devnet';

const ETH_MAINNET_CHAIN_ID = '0x1';
const ETH_SEPOLIA_CHAIN_ID = '0xaa36a7';

export function getExpectedNetworks(mode: NetworkMode) {
  if (mode === 'devnet') {
    return {
      ethChainId: ETH_SEPOLIA_CHAIN_ID,
      ethName: 'Sepolia',
      cardanoNetworkId: 0,
      cardanoName: 'Preview',
    };
  }
  return {
    ethChainId: ETH_MAINNET_CHAIN_ID,
    ethName: 'Mainnet',
    cardanoNetworkId: 1,
    cardanoName: 'Mainnet',
  };
}

export function getInitialNetworkMode(search: string): NetworkMode {
  const params = new URLSearchParams(search);
  return params.has('devnet') ? 'devnet' : 'mainnet';
}
