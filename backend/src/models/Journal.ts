import { pool } from "../utils/db";

export interface JournalAnalysis {
  mood: string;
  moodEmoji: string;
  themes: string[];
  insight: string;
  affirmation: string;
}

export interface Journal {
  id: string;
  userId: string;
  prompt: string;
  content: string;
  moodScore: number | null;
  themes: string[] | null;
  aiPromptContext: string | null;
  aiAnalysis: JournalAnalysis | null;
  createdAt: Date;
  updatedAt: Date;
}

function mapJournal(row: any): Journal {
  return {
    id: row.id,
    userId: row.user_id,
    prompt: row.prompt,
    content: row.content,
    moodScore: row.mood_score,
    themes: row.themes,
    aiPromptContext: row.ai_prompt_context,
    aiAnalysis: row.ai_analysis,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createJournal(params: {
  userId: string;
  prompt: string;
  themes?: string[];
  aiPromptContext?: string;
}): Promise<Journal> {
  const { rows } = await pool.query(
    `INSERT INTO journals (user_id, prompt, themes, ai_prompt_context)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [
      params.userId,
      params.prompt,
      params.themes ?? [],
      params.aiPromptContext ?? null,
    ]
  );
  return mapJournal(rows[0]);
}

export async function findTodayJournal(
  userId: string,
  todayStart: Date
): Promise<Journal | null> {
  const { rows } = await pool.query(
    `SELECT * FROM journals WHERE user_id = $1 AND created_at >= $2 ORDER BY created_at DESC LIMIT 1`,
    [userId, todayStart]
  );
  return rows[0] ? mapJournal(rows[0]) : null;
}

// Ownership enforced in SQL (WHERE id = $1 AND user_id = $2).
export async function findJournalByIdAndUser(
  journalId: string,
  userId: string
): Promise<Journal | null> {
  const { rows } = await pool.query(
    `SELECT * FROM journals WHERE id = $1 AND user_id = $2`,
    [journalId, userId]
  );
  return rows[0] ? mapJournal(rows[0]) : null;
}

export async function updateJournalContent(
  journalId: string,
  content: string
): Promise<Journal> {
  const { rows } = await pool.query(
    `UPDATE journals SET content = $2 WHERE id = $1 RETURNING *`,
    [journalId, content]
  );
  return mapJournal(rows[0]);
}

export async function updateJournalAnalysis(
  journalId: string,
  analysis: JournalAnalysis
): Promise<Journal> {
  const { rows } = await pool.query(
    `UPDATE journals SET ai_analysis = $2 WHERE id = $1 RETURNING *`,
    [journalId, JSON.stringify(analysis)]
  );
  return mapJournal(rows[0]);
}

export async function getJournalHistory(
  userId: string,
  limit: number
): Promise<Journal[]> {
  const { rows } = await pool.query(
    `SELECT * FROM journals WHERE user_id = $1 AND content <> '' ORDER BY created_at DESC LIMIT $2`,
    [userId, limit]
  );
  return rows.map(mapJournal);
}

export async function getJournalsInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<Journal[]> {
  const { rows } = await pool.query(
    `SELECT * FROM journals WHERE user_id = $1 AND created_at BETWEEN $2 AND $3 AND content <> ''`,
    [userId, start, end]
  );
  return rows.map(mapJournal);
}
