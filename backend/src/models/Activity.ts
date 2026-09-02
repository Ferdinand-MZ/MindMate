import { pool } from "../utils/db";

export const ACTIVITY_TYPES = [
  "meditation",
  "exercise",
  "walking",
  "reading",
  "journaling",
  "therapy",
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

// Maps Indonesian display names → canonical English enum values
const TYPE_ALIAS_MAP: Record<string, string> = {
  meditation: "meditation",
  exercise: "exercise",
  walking: "walking",
  reading: "reading",
  journaling: "journaling",
  therapy: "therapy",
  meditasi: "meditation",
  olahraga: "exercise",
  jalan: "walking",
  "jalan kaki": "walking",
  membaca: "reading",
  jurnal: "journaling",
  terapi: "therapy",
};

export function normalizeActivityType(val: string): string {
  return TYPE_ALIAS_MAP[val?.toLowerCase()] ?? val?.toLowerCase();
}

export interface Activity {
  id: string;
  userId: string;
  type: string;
  name: string;
  description: string | null;
  duration: number | null;
  difficulty: string | null;
  feedback: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

function mapActivity(row: any): Activity {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    name: row.name,
    description: row.description,
    duration: row.duration,
    difficulty: row.difficulty,
    feedback: row.feedback,
    timestamp: row.timestamp,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createActivity(params: {
  userId: string;
  type: string;
  name: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  feedback?: string;
}): Promise<Activity> {
  const normalizedType = normalizeActivityType(params.type);
  if (!ACTIVITY_TYPES.includes(normalizedType as ActivityType)) {
    throw Object.assign(new Error(`Invalid activity type: ${params.type}`), {
      statusCode: 400,
    });
  }
  const { rows } = await pool.query(
    `INSERT INTO activities (user_id, type, name, description, duration, difficulty, feedback)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [
      params.userId,
      normalizedType,
      params.name,
      params.description ?? null,
      params.duration ?? null,
      params.difficulty ?? null,
      params.feedback ?? null,
    ]
  );
  return mapActivity(rows[0]);
}

export async function getActivitiesInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Activity[]> {
  const { rows } = await pool.query(
    `SELECT * FROM activities WHERE user_id = $1 AND "timestamp" BETWEEN $2 AND $3 ORDER BY "timestamp" DESC`,
    [userId, start, end]
  );
  return rows.map(mapActivity);
}

export async function getAllActivities(
  userId: string,
  limit: number
): Promise<Activity[]> {
  const { rows } = await pool.query(
    `SELECT * FROM activities WHERE user_id = $1 ORDER BY "timestamp" DESC LIMIT $2`,
    [userId, limit]
  );
  return rows.map(mapActivity);
}

export async function getActivitiesSince(
  userId: string,
  since: Date
): Promise<Activity[]> {
  const { rows } = await pool.query(
    `SELECT * FROM activities WHERE user_id = $1 AND "timestamp" >= $2 ORDER BY "timestamp" ASC`,
    [userId, since]
  );
  return rows.map(mapActivity);
}

export async function countActivities(userId: string): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM activities WHERE user_id = $1`,
    [userId]
  );
  return rows[0].count;
}

export async function findActivityInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Activity | null> {
  const { rows } = await pool.query(
    `SELECT * FROM activities WHERE user_id = $1 AND "timestamp" BETWEEN $2 AND $3 LIMIT 1`,
    [userId, start, end]
  );
  return rows[0] ? mapActivity(rows[0]) : null;
}
