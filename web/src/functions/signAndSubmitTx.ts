import { CML } from '@lucid-evolution/lucid';
/**
 * CIP-30 sign + submit for Lucid evolution completed transactions.
 * Ported from temp/ctools reference implementation.
 */
export const signAndSubmitTx = async (tx: { toCBOR: () => string; toTransaction: () => { body: () => { to_cbor_hex: () => string } } }, api: { signTx: (tx: string) => Promise<string>; submitTx: (tx: string) => Promise<string> }) => {
  const txbytes = tx.toCBOR();
  const witnesses = await api.signTx(txbytes);
  const witnessSet = CML.TransactionWitnessSet.from_cbor_hex(witnesses);
  const witnessSetBuilder = CML.TransactionWitnessSetBuilder.new();
  witnessSetBuilder.add_existing(witnessSet);

  const txObj = CML.Transaction.from_cbor_hex(txbytes);
  witnessSetBuilder.add_existing(txObj.witness_set());

  const cborBody = tx.toTransaction().body().to_cbor_hex();
  const txBody = CML.TransactionBody.from_cbor_hex(cborBody);

  const auxiliaryData = txObj.auxiliary_data();

  const signedTx = CML.Transaction.new(txBody, witnessSetBuilder.build(), true, auxiliaryData);

  const signedTxBytes = signedTx.to_cbor_hex();
  await api.submitTx(signedTxBytes);
};
