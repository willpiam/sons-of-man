const ETHERSCAN_BASE_URL = {
  mainnet: "https://api.etherscan.io/api",
  devnet: "https://api-sepolia.etherscan.io/api",
};

const BLOCKFROST_BASE_URL = {
  mainnet: "https://cardano-mainnet.blockfrost.io/api/v0",
  devnet: "https://cardano-preview.blockfrost.io/api/v0",
};

function isValidHexLike(value) {
  return typeof value === "string" && /^[a-fA-F0-9]+$/.test(value);
}

async function verifyEthereumTx(txHash, networkMode) {
  if (!process.env.ETHERSCAN_API_KEY) {
    throw new Error("ETHERSCAN_API_KEY is not configured.");
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return false;
  }

  const baseUrl = ETHERSCAN_BASE_URL[networkMode];
  if (!baseUrl) {
    throw new Error(`Unsupported Ethereum network mode: ${networkMode}`);
  }

  const searchParams = new URLSearchParams({
    module: "proxy",
    action: "eth_getTransactionReceipt",
    txhash: txHash,
    apikey: process.env.ETHERSCAN_API_KEY,
  });
  const response = await fetch(`${baseUrl}?${searchParams.toString()}`);
  if (!response.ok) {
    throw new Error(`Etherscan request failed with status ${response.status}`);
  }
  const payload = await response.json();
  if (payload.error) {
    throw new Error(`Etherscan error: ${payload.error.message || "Unknown error"}`);
  }
  return Boolean(payload.result);
}

async function verifyCardanoTx(txHash, networkMode) {
  const projectId =
    networkMode === "devnet"
      ? process.env.BLOCKFROST_PREVIEW_PROJECT_ID
      : process.env.BLOCKFROST_PROJECT_ID;

  if (!projectId) {
    throw new Error(`Missing Blockfrost key for ${networkMode}.`);
  }
  if (!isValidHexLike(txHash) || txHash.length < 32) {
    return false;
  }

  const baseUrl = BLOCKFROST_BASE_URL[networkMode];
  if (!baseUrl) {
    throw new Error(`Unsupported Cardano network mode: ${networkMode}`);
  }

  const response = await fetch(`${baseUrl}/txs/${txHash}`, {
    headers: {
      project_id: projectId,
    },
  });

  if (response.status === 404) {
    return false;
  }
  if (!response.ok) {
    throw new Error(`Blockfrost request failed with status ${response.status}`);
  }
  return true;
}

export async function verifyTxOnChain({ chain, txHash, networkMode }) {
  if (chain === "ethereum") {
    return verifyEthereumTx(txHash, networkMode);
  }
  if (chain === "cardano") {
    return verifyCardanoTx(txHash, networkMode);
  }
  throw new Error(`Unsupported chain: ${chain}`);
}
