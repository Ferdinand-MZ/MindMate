// Applies backend/db/schema.sql against DATABASE_URL. Safe to re-run :
// every statement in schema.sql is written with IF NOT EXISTS / CREATE OR
// REPLACE / DROP ... IF EXISTS semantics. Useful when not using the Docker
// Postgres image's auto-init (e.g. pointing at Supabase/RDS/Neon).
import fs from "fs";
import path from "path";
import { pool } from "../utils/db";
import { logger } from "../utils/logger";

async function migrate() {
  const schemaPath = path.join(__dirname, "..", "..", "db", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  try {
    await pool.query(sql);
    logger.info("Migration applied successfully");
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
