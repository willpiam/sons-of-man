import type { NetworkMode } from './network';

const encoder = new TextEncoder();
const ETH_DEAD_ADDRESS = '0x000000000000000000000000000000000000dEaD';

function utf8ToHex(text: string) {
  const bytes = encoder.encode(text);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function splitForCip20(text: string, maxBytes = 64): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const char of text) {
    const next = current + char;
    if (encoder.encode(next).length <= maxBytes) {
      current = next;
      continue;
    }
    if (!current) {
      throw new Error('A character exceeds 64 bytes and cannot be encoded for CIP-20.');
    }
    chunks.push(current);
    current = char;
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

export function getExplorerUrl(chain: string, networkMode: NetworkMode, txHash: string) {
  if (!txHash) {
    return '';
  }
  if (chain === 'ethereum') {
    return networkMode === 'devnet'
      ? `https://sepolia.etherscan.io/tx/${txHash}`
      : `https://etherscan.io/tx/${txHash}`;
  }
  if (chain === 'cardano') {
    return networkMode === 'devnet'
      ? `https://preview.cardanoscan.io/transaction/${txHash}`
      : `https://cardanoscan.io/transaction/${txHash}`;
  }
  return '';
}

export function buildCommitmentText(oathText: string, signerName: string) {
  const cleanOath = String(oathText || '').trim();
  const cleanName = String(signerName || '').trim();
  if (!cleanOath) {
    throw new Error('Oath text is missing.');
  }
  if (!cleanName) {
    throw new Error('Signer name is required.');
  }
  return `${cleanOath}\n\nSigned by: ${cleanName}`;
}

export { encoder, utf8ToHex, ETH_DEAD_ADDRESS };
