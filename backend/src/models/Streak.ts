import { pool } from "../utils/db";

export interface Streak {
  id: string;
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Date | null;
  totalCheckIns: number;
}

function mapStreak(row: any): Streak {
  return {
    id: row.id,
    userId: row.user_id,
    currentStreak: row.current_streak,
    longestStreak: row.longest_streak,
    lastCheckInDate: row.last_check_in_date,
    totalCheckIns: row.total_check_ins,
  };
}

// Upsert instead of findOne-then-create : closes the race condition where
// two concurrent first-ever requests for a brand-new user both passed the
// findOne check and then both attempted create, with the loser hitting an
// unhandled unique-constraint violation.
export async function getOrCreateStreak(userId: string): Promise<Streak> {
  const { rows } = await pool.query(
    `INSERT INTO streaks (user_id) VALUES ($1)
     ON CONFLICT (user_id) DO UPDATE SET user_id = EXCLUDED.user_id
     RETURNING *`,
    [userId]
  );
  return mapStreak(rows[0]);
}

export async function resetCurrentStreak(userId: string): Promise<Streak> {
  const { rows } = await pool.query(
    `UPDATE streaks SET current_streak = 0 WHERE user_id = $1 RETURNING *`,
    [userId]
  );
  return mapStreak(rows[0]);
}

export async function recordCheckIn(
  userId: string,
  newStreak: number,
  newLongest: number,
  today: Date
): Promise<Streak> {
  const { rows } = await pool.query(
    `UPDATE streaks
     SET current_streak = $2, longest_streak = $3, last_check_in_date = $4, total_check_ins = total_check_ins + 1
     WHERE user_id = $1 RETURNING *`,
    [userId, newStreak, newLongest, today]
  );
  return mapStreak(rows[0]);
}
