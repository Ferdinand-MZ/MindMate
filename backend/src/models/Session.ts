import { pool } from "../utils/db";

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  deviceInfo: string | null;
  lastActive: Date;
}

function mapSession(row: any): Session {
  return {
    id: row.id,
    userId: row.user_id,
    token: row.token,
    expiresAt: row.expires_at,
    deviceInfo: row.device_info,
    lastActive: row.last_active,
  };
}

export async function createSession(
  userId: string,
  token: string,
  expiresAt: Date,
  deviceInfo?: string
): Promise<Session> {
  const { rows } = await pool.query(
    `INSERT INTO sessions (user_id, token, expires_at, device_info) VALUES ($1, $2, $3, $4) RETURNING *`,
    [userId, token, expiresAt, deviceInfo ?? null]
  );
  return mapSession(rows[0]);
}

// Only returns a session if it exists AND hasn't expired : used by the auth
// middleware so a deleted/expired session actually invalidates its JWT
// (this was previously not checked at all, so "logout" never really
// invalidated the token until natural JWT expiry).
export async function findActiveSessionByToken(
  token: string
): Promise<Session | null> {
  const { rows } = await pool.query(
    `SELECT * FROM sessions WHERE token = $1 AND expires_at > now()`,
    [token]
  );
  return rows[0] ? mapSession(rows[0]) : null;
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await pool.query(`DELETE FROM sessions WHERE token = $1`, [token]);
}

// Used by a scheduled Inngest cron function : Postgres has no equivalent to
// Mongo's TTL index, so expired sessions need explicit periodic cleanup.
export async function deleteExpiredSessions(): Promise<number> {
  const { rowCount } = await pool.query(
    `DELETE FROM sessions WHERE expires_at < now()`
  );
  return rowCount ?? 0;
}
