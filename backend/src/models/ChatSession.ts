import { pool } from "../utils/db";

export interface ChatMessageAnalysis {
  emotionalState: string;
  themes: string[];
  riskLevel: number;
  recommendedApproach: string;
  progressIndicators: string[];
  weatherInfluence?: string;
}

export interface ChatMessageMetadata {
  analysis?: ChatMessageAnalysis;
  progress?: {
    emotionalState: string;
    riskLevel: number;
    weatherInfluence?: string;
  };
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata: ChatMessageMetadata | null;
}

export interface ChatSession {
  id: string;
  userId: string;
  startTime: Date;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}

function mapSession(row: any): ChatSession {
  return {
    id: row.id,
    userId: row.user_id,
    startTime: row.start_time,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMessage(row: any): ChatMessage {
  return {
    id: row.id,
    sessionId: row.session_id,
    role: row.role,
    content: row.content,
    timestamp: row.timestamp,
    metadata: row.metadata,
  };
}

export async function createChatSession(userId: string): Promise<ChatSession> {
  const { rows } = await pool.query(
    `INSERT INTO chat_sessions (user_id, start_time, status) VALUES ($1, now(), 'active') RETURNING *`,
    [userId]
  );
  return mapSession(rows[0]);
}

export async function findChatSessionById(
  sessionId: string
): Promise<ChatSession | null> {
  const { rows } = await pool.query(
    `SELECT * FROM chat_sessions WHERE id = $1`,
    [sessionId]
  );
  return rows[0] ? mapSession(rows[0]) : null;
}

// Ownership enforced in SQL (WHERE id = $1 AND user_id = $2) rather than a
// separate post-fetch check : fixes the IDOR where getChatSession had no
// ownership check at all.
export async function findChatSessionByIdAndUser(
  sessionId: string,
  userId: string
): Promise<ChatSession | null> {
  const { rows } = await pool.query(
    `SELECT * FROM chat_sessions WHERE id = $1 AND user_id = $2`,
    [sessionId, userId]
  );
  return rows[0] ? mapSession(rows[0]) : null;
}

export async function listChatMessages(
  sessionId: string
): Promise<ChatMessage[]> {
  const { rows } = await pool.query(
    `SELECT * FROM chat_messages WHERE session_id = $1 ORDER BY "timestamp" ASC`,
    [sessionId]
  );
  return rows.map(mapMessage);
}

export async function addChatMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string,
  metadata?: ChatMessageMetadata
): Promise<ChatMessage> {
  const { rows } = await pool.query(
    `INSERT INTO chat_messages (session_id, role, content, metadata) VALUES ($1, $2, $3, $4) RETURNING *`,
    [sessionId, role, content, metadata ? JSON.stringify(metadata) : null]
  );
  return mapMessage(rows[0]);
}

export async function listChatSessionsByUser(
  userId: string
): Promise<ChatSession[]> {
  const { rows } = await pool.query(
    `SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY start_time DESC`,
    [userId]
  );
  return rows.map(mapSession);
}

export async function listRecentChatSessionsByUser(
  userId: string,
  limit: number
): Promise<ChatSession[]> {
  const { rows } = await pool.query(
    `SELECT * FROM chat_sessions WHERE user_id = $1 ORDER BY start_time DESC LIMIT $2`,
    [userId, limit]
  );
  return rows.map(mapSession);
}

export async function listChatSessionsInRange(
  userId: string,
  start: Date,
  end: Date
): Promise<ChatSession[]> {
  const { rows } = await pool.query(
    `SELECT * FROM chat_sessions WHERE user_id = $1 AND start_time BETWEEN $2 AND $3`,
    [userId, start, end]
  );
  return rows.map(mapSession);
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  await pool.query(`DELETE FROM chat_sessions WHERE id = $1`, [sessionId]);
}

// Themes flattened from every message's metadata.analysis.themes across a
// set of sessions : replaces the in-app flattening of embedded Mongo
// subdocuments with a single indexed JOIN query.
export async function getThemesForSessions(
  sessionIds: string[]
): Promise<string[]> {
  if (sessionIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT metadata FROM chat_messages WHERE session_id = ANY($1::uuid[]) AND metadata IS NOT NULL`,
    [sessionIds]
  );
  const themes: string[] = [];
  for (const row of rows) {
    const analysisThemes = row.metadata?.analysis?.themes;
    if (Array.isArray(analysisThemes)) themes.push(...analysisThemes);
  }
  return themes;
}

// Message + session-level aggregates used by the progress report (total
// message count, theme frequency) for sessions within a date range.
export async function getMessagesForSessions(
  sessionIds: string[]
): Promise<ChatMessage[]> {
  if (sessionIds.length === 0) return [];
  const { rows } = await pool.query(
    `SELECT * FROM chat_messages WHERE session_id = ANY($1::uuid[])`,
    [sessionIds]
  );
  return rows.map(mapMessage);
}
