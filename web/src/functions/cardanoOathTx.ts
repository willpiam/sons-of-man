import { API_BASE_URL } from '../api/client';
import type { NetworkMode } from '../utils/network';
import { signAndSubmitTx } from './signAndSubmitTx';
import type { CardanoCip30Api } from '../types/cip30';

function getBlockfrostProxyUrl(mode: NetworkMode): string {
  const network = mode === 'devnet' ? 'preview' : 'mainnet';
  const base = API_BASE_URL.replace(/\/+$/, '');
  return `${base}/blockfrost/${network}`;
}

function getLucidNetworkLabel(mode: NetworkMode): 'Mainnet' | 'Preview' {
  return mode === 'devnet' ? 'Preview' : 'Mainnet';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function createLucidWithCip30Wallet(api: CardanoCip30Api, networkMode: NetworkMode): Promise<any> {
  const { Blockfrost } = await import('@lucid-evolution/provider');
  const { Lucid } = await import('@lucid-evolution/lucid');
  const url = getBlockfrostProxyUrl(networkMode);
  const lucid = await Lucid(new Blockfrost(url, ''), getLucidNetworkLabel(networkMode));
  // CIP-30 API from browser wallets; Lucid's WalletApi is a superset
  lucid.selectWallet.fromAPI(api as never);
  return lucid;
}

export async function sendCardanoCip20OathMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  lucid: any,
  api: CardanoCip30Api,
  messageChunks: string[],
): Promise<string> {
  if (!messageChunks.length) {
    throw new Error('Message metadata cannot be empty.');
  }
  const address = await lucid.wallet().address();
  const txBuilder = lucid
    .newTx()
    .pay.ToAddress(address, { lovelace: BigInt(1000000) })
    .attachMetadata(674, messageChunks);
  const tx = await txBuilder.complete();
  const txHash = tx.toHash();
  await signAndSubmitTx(tx, api);
  return txHash;
}
