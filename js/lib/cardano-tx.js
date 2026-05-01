import { getBlockfrostProxyUrl, getLucidNetwork, loadLucid, loadLucidProvider } from "./lucid-evolution.js";
import { walletState } from "./wallet-state.js";

export function buildCip20Metadata(messageChunks) {
  return { msg: messageChunks };
}

export async function sendCardanoCip20Message(api, messageChunks) {
  if (!api) {
    throw new Error("Cardano wallet is not connected.");
  }
  if (!Array.isArray(messageChunks) || messageChunks.length === 0) {
    throw new Error("Message metadata cannot be empty.");
  }

  const mode = walletState.app.networkMode;
  const [{ Lucid }, { Blockfrost }] = await Promise.all([loadLucid(), loadLucidProvider()]);
  const lucid = await Lucid(new Blockfrost(getBlockfrostProxyUrl(mode), ""), getLucidNetwork(mode));
  lucid.selectWallet.fromAPI(api);

  const metadata = buildCip20Metadata(messageChunks);
  const tx = await lucid.newTx().attachMetadata(674, metadata).complete();
  const signedTx = await tx.sign.withWallet().complete();
  return signedTx.submit();
}
