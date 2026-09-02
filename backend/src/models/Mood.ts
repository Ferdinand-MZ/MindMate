import { pool } from "../utils/db";

export interface Mood {
  id: string;
  userId: string;
  score: number;
  note: string | null;
  context: Record<string, unknown> | null;
  activities: string[] | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

function mapMood(row: any): Mood {
  return {
    id: row.id,
    userId: row.user_id,
    score: row.score,
    note: row.note,
    context: row.context,
    activities: row.activities,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Note: unlike the old Mongoose schema, `context`/`activities` are real
// columns here : previously the controller accepted them from the request
// body but the schema silently dropped them (data loss).
export async function createMood(params: {
  userId: string;
  score: number;
  note?: string;
  context?: Record<string, unknown>;
  activities?: string[];
}): Promise<Mood> {
  const { rows } = await pool.query(
    `INSERT INTO moods (user_id, score, note, context, activities)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [
      params.userId,
      params.score,
      params.note ?? null,
      params.context ? JSON.stringify(params.context) : null,
      params.activities ?? null,
    ]
  );
  return mapMood(rows[0]);
}

export async function getMoodHistory(
  userId: string,
  limit: number
): Promise<Mood[]> {
  const { rows } = await pool.query(
    `SELECT * FROM moods WHERE user_id = $1 ORDER BY "timestamp" DESC LIMIT $2`,
    [userId, limit]
  );
  return rows.map(mapMood);
}

export async function getMoodsInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Mood[]> {
  const { rows } = await pool.query(
    `SELECT * FROM moods WHERE user_id = $1 AND "timestamp" BETWEEN $2 AND $3 ORDER BY "timestamp" ASC`,
    [userId, start, end]
  );
  return rows.map(mapMood);
}

export async function getMoodsSince(
  userId: string,
  since: Date
): Promise<Mood[]> {
  const { rows } = await pool.query(
    `SELECT * FROM moods WHERE user_id = $1 AND "timestamp" >= $2 ORDER BY "timestamp" DESC`,
    [userId, since]
  );
  return rows.map(mapMood);
}

export async function findMoodInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Mood | null> {
  const { rows } = await pool.query(
    `SELECT * FROM moods WHERE user_id = $1 AND "timestamp" BETWEEN $2 AND $3 LIMIT 1`,
    [userId, start, end]
  );
  return rows[0] ? mapMood(rows[0]) : null;
}
