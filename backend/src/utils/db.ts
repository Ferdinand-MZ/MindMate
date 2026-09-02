import { Pool } from "pg";
import { env } from "../config/env";
import { logger } from "./logger";

export const pool = new Pool({
  connectionString: env.databaseUrl,
  connectionTimeoutMillis: 10000,
});

pool.on("error", (err) => {
  // Errors on idle clients : the pool recovers on its own, just log it.
  logger.error("Postgres pool error:", err);
});

export const connectDB = async () => {
  try {
    await pool.query("SELECT 1");
    logger.info("Connected to PostgreSQL");
  } catch (error) {
    logger.error("PostgreSQL initial connection error:", error);
    process.exit(1);
  }
};
