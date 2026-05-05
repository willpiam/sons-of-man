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
    ALTER TABLE oath_events
    ADD COLUMN IF NOT EXISTS wallet_address TEXT,
    ADD COLUMN IF NOT EXISTS network_mode TEXT DEFAULT 'mainnet',
    ADD COLUMN IF NOT EXISTS explorer_url TEXT,
    ADD COLUMN IF NOT EXISTS verified_on_chain BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
  `);

  await pool.query(`
    UPDATE oath_events
    SET
      network_mode = COALESCE(NULLIF(network_mode, ''), 'mainnet'),
      verified_on_chain = COALESCE(verified_on_chain, FALSE),
      created_at = COALESCE(created_at, NOW())
    WHERE
      network_mode IS NULL
      OR network_mode = ''
      OR verified_on_chain IS NULL
      OR created_at IS NULL;
  `);

  await pool.query(`
    ALTER TABLE oath_events
    ALTER COLUMN network_mode SET NOT NULL,
    ALTER COLUMN verified_on_chain SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'oath_events_network_mode_check'
      ) THEN
        ALTER TABLE oath_events
        ADD CONSTRAINT oath_events_network_mode_check
        CHECK (network_mode IN ('mainnet', 'devnet'));
      END IF;
    END
    $$;
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
