import "dotenv/config";
import { pool } from "../db.js";

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS oath_events (
      id BIGSERIAL PRIMARY KEY,
      signer_name TEXT NOT NULL,
      chain TEXT NOT NULL CHECK (chain IN ('ethereum', 'cardano')),
      tx_hash TEXT NOT NULL,
      wallet_address TEXT,
      network_mode TEXT NOT NULL CHECK (network_mode IN ('mainnet', 'devnet')),
      explorer_url TEXT,
      verified_on_chain BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS oath_events_created_at_desc_idx
    ON oath_events (created_at DESC, id DESC);
  `);
}

migrate()
  .then(() => {
    console.log("Migration complete.");
    return pool.end();
  })
  .catch((error) => {
    console.error("Migration failed:", error);
    return pool.end().finally(() => process.exit(1));
  });
