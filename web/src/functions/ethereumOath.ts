import type { NetworkMode } from '../utils/network';
import { getExpectedNetworks } from '../utils/network';
import { encoder, ETH_DEAD_ADDRESS, utf8ToHex } from '../utils/oathCommit';

export async function signEthereumOathTransaction(
  commitment: string,
  fromAddress: string,
  networkMode: NetworkMode,
): Promise<string> {
  if (!window.ethereum) {
    throw new Error('Ethereum wallet is not connected.');
  }
  const expected = getExpectedNetworks(networkMode);
  const actualChainId = (await window.ethereum.request({ method: 'eth_chainId' })) as string;
  if (actualChainId !== expected.ethChainId) {
    throw new Error(
      `Ethereum wallet is on ${actualChainId}. Switch to ${expected.ethName} for ${networkMode} mode.`,
    );
  }
  const txHash = (await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: fromAddress,
        to: ETH_DEAD_ADDRESS,
        value: '0x0',
        data: `0x${utf8ToHex(commitment)}`,
      },
    ],
  })) as string;
  return txHash;
}

/** Validate UTF-8 commitment fits calldata (same constraints as legacy oath-signer). */
export function validateEthereumCommitmentBytes(commitment: string) {
  const bytes = encoder.encode(commitment);
  if (bytes.length > 32000) {
    throw new Error('Commitment is too large for an Ethereum transaction.');
  }
}
