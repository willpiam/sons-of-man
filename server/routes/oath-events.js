import { Router } from "express";
import { pool } from "../db.js";
import { verifyTxOnChain } from "../services/verify-tx.js";

const router = Router();

const CHAINS = new Set(["ethereum", "cardano"]);
const MODES = new Set(["mainnet", "devnet"]);
const LIST_MODES = new Set(["mainnet", "devnet", "all"]);

function cleanText(input, maxLen = 10_000) {
  if (input === null || input === undefined) {
    return "";
  }
  return String(input).trim().slice(0, maxLen);
}

function normalizeCreatePayload(body) {
  const signerName = cleanText(body.signer_name, 120);
  const chain = cleanText(body.chain, 30).toLowerCase();
  const txHash = cleanText(body.tx_hash, 256);
  const walletAddress = cleanText(body.wallet_address, 256);
  const networkMode = cleanText(body.network_mode, 20).toLowerCase();
  const explorerUrl = cleanText(body.explorer_url, 500);

  if (!signerName) {
    throw new Error("signer_name is required.");
  }
  if (!CHAINS.has(chain)) {
    throw new Error("chain must be ethereum or cardano.");
  }
  if (!txHash) {
    throw new Error("tx_hash is required.");
  }
  if (!MODES.has(networkMode)) {
    throw new Error("network_mode must be mainnet or devnet.");
  }

  return {
    signerName,
    chain,
    txHash,
    walletAddress: walletAddress || null,
    networkMode,
    explorerUrl: explorerUrl || null,
  };
}

router.post("/oath-events", async (req, res) => {
  let payload;
  try {
    payload = normalizeCreatePayload(req.body ?? {});
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }

  let verifiedOnChain = false;
  let verifyError = null;

  try {
    verifiedOnChain = await verifyTxOnChain({
      chain: payload.chain,
      txHash: payload.txHash,
      networkMode: payload.networkMode,
    });
  } catch (error) {
    verifyError = error.message || "Verification request failed.";
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO oath_events
          (signer_name, chain, tx_hash, wallet_address, network_mode, explorer_url, verified_on_chain)
        VALUES
          ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, signer_name, chain, tx_hash, wallet_address, network_mode, explorer_url, verified_on_chain, created_at
      `,
      [
        payload.signerName,
        payload.chain,
        payload.txHash,
        payload.walletAddress,
        payload.networkMode,
        payload.explorerUrl,
        verifiedOnChain,
      ],
    );

    return res.status(201).json({
      data: result.rows[0],
      verification: { attempted: true, error: verifyError },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to save oath event." });
  }
});

router.get("/oath-events", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  const networkMode = cleanText(req.query.network_mode, 20).toLowerCase() || "mainnet";

  if (!LIST_MODES.has(networkMode)) {
    return res.status(400).json({ error: "network_mode must be mainnet, devnet, or all." });
  }

  try {
    const isAllMode = networkMode === "all";
    const listQuery = isAllMode
      ? `
          SELECT id, signer_name, chain, tx_hash, wallet_address, network_mode, explorer_url, verified_on_chain, created_at
          FROM oath_events
          ORDER BY created_at DESC, id DESC
          LIMIT $1 OFFSET $2
        `
      : `
          SELECT id, signer_name, chain, tx_hash, wallet_address, network_mode, explorer_url, verified_on_chain, created_at
          FROM oath_events
          WHERE network_mode = $3
          ORDER BY created_at DESC, id DESC
          LIMIT $1 OFFSET $2
        `;
    const listParams = isAllMode ? [limit, offset] : [limit, offset, networkMode];
    const countQuery = isAllMode
      ? "SELECT COUNT(*)::int AS total FROM oath_events"
      : "SELECT COUNT(*)::int AS total FROM oath_events WHERE network_mode = $1";
    const countParams = isAllMode ? [] : [networkMode];

    const [rowsResult, countResult] = await Promise.all([
      pool.query(listQuery, listParams),
      pool.query(countQuery, countParams),
    ]);

    return res.json({
      data: rowsResult.rows,
      page,
      limit,
      network_mode: networkMode,
      total: countResult.rows[0]?.total || 0,
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch oath events." });
  }
});

router.post("/oath-events/:id/verify", async (req, res) => {
  const id = Number.parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: "Invalid event id." });
  }

  try {
    const existing = await pool.query(
      `
        SELECT id, chain, tx_hash, network_mode, verified_on_chain
        FROM oath_events
        WHERE id = $1
      `,
      [id],
    );
    if (existing.rowCount === 0) {
      return res.status(404).json({ error: "Event not found." });
    }

    const row = existing.rows[0];
    let verifiedOnChain = row.verified_on_chain;
    let verifyError = null;

    try {
      verifiedOnChain = await verifyTxOnChain({
        chain: row.chain,
        txHash: row.tx_hash,
        networkMode: row.network_mode,
      });
    } catch (error) {
      verifyError = error.message || "Verification request failed.";
      verifiedOnChain = false;
    }

    const updated = await pool.query(
      `
        UPDATE oath_events
        SET verified_on_chain = $2
        WHERE id = $1
        RETURNING id, signer_name, chain, tx_hash, wallet_address, network_mode, explorer_url, verified_on_chain, created_at
      `,
      [id, verifiedOnChain],
    );

    return res.json({
      data: updated.rows[0],
      verification: { attempted: true, error: verifyError },
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to verify event." });
  }
});

export default router;
