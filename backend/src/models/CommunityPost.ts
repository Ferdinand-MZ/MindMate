import { pool } from "../utils/db";

export interface Reactions {
  heart: number;
  hug: number;
  strength: number;
  peace: number;
  sparkle: number;
}

export interface CommunityPost {
  id: string;
  content: string;
  reactions: Reactions;
  isActive: boolean;
  createdAt: Date;
}

export interface CommunityPostWithOwner extends CommunityPost {
  anonId: string;
}

function mapPost(row: any): CommunityPost {
  return {
    id: row.id,
    content: row.content,
    reactions: row.reactions,
    isActive: row.is_active,
    createdAt: row.created_at,
  };
}

export async function getActivePosts(
  limit: number,
  offset: number
): Promise<CommunityPost[]> {
  const { rows } = await pool.query(
    `SELECT id, content, reactions, is_active, created_at FROM community_posts
     WHERE is_active = true ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows.map(mapPost);
}

export async function countActivePosts(): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM community_posts WHERE is_active = true`
  );
  return rows[0].count;
}

// Indexed count (anon_id, created_at) : replaces the previous full
// site-wide-per-day scan-and-filter-in-JS rate-limit check.
export async function countPostsByAnonSince(
  anonId: string,
  since: Date
): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COUNT(*)::int AS count FROM community_posts WHERE anon_id = $1 AND created_at >= $2`,
    [anonId, since]
  );
  return rows[0].count;
}

// Wrapped by the caller in a transaction holding an advisory lock keyed on
// anon_id, so the rate-limit check + insert are effectively atomic per user
// (closes the TOCTOU race that allowed the 5-post/day cap to be bypassed).
export async function createPost(
  anonId: string,
  content: string
): Promise<CommunityPost> {
  const { rows } = await pool.query(
    `INSERT INTO community_posts (anon_id, content) VALUES ($1, $2)
     RETURNING id, content, reactions, is_active, created_at`,
    [anonId, content]
  );
  return mapPost(rows[0]);
}

export async function createPostRateLimited(
  anonId: string,
  content: string,
  maxPerDay: number,
  since: Date
): Promise<CommunityPost | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Serializes concurrent create attempts from the same anon_id.
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [anonId]);
    const { rows: countRows } = await client.query(
      `SELECT COUNT(*)::int AS count FROM community_posts WHERE anon_id = $1 AND created_at >= $2`,
      [anonId, since]
    );
    if (countRows[0].count >= maxPerDay) {
      await client.query("ROLLBACK");
      return null;
    }
    const { rows } = await client.query(
      `INSERT INTO community_posts (anon_id, content) VALUES ($1, $2)
       RETURNING id, content, reactions, is_active, created_at`,
      [anonId, content]
    );
    await client.query("COMMIT");
    return mapPost(rows[0]);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

const VALID_REACTIONS = ["heart", "hug", "strength", "peace", "sparkle"];

export async function reactToPost(
  postId: string,
  reaction: string
): Promise<Reactions | null> {
  if (!VALID_REACTIONS.includes(reaction)) {
    throw Object.assign(new Error("Invalid reaction type"), {
      statusCode: 400,
    });
  }
  const { rows } = await pool.query(
    `UPDATE community_posts
     SET reactions = jsonb_set(reactions, $2, ((reactions->>$3)::int + 1)::text::jsonb)
     WHERE id = $1 AND is_active = true
     RETURNING reactions`,
    [postId, `{${reaction}}`, reaction]
  );
  return rows[0] ? rows[0].reactions : null;
}

export async function findPostByIdWithOwner(
  postId: string
): Promise<CommunityPostWithOwner | null> {
  const { rows } = await pool.query(
    `SELECT * FROM community_posts WHERE id = $1`,
    [postId]
  );
  return rows[0] ? { ...mapPost(rows[0]), anonId: rows[0].anon_id } : null;
}

export async function deactivatePost(postId: string): Promise<void> {
  await pool.query(`UPDATE community_posts SET is_active = false WHERE id = $1`, [
    postId,
  ]);
}

// UUID format check : replaces relying on Mongoose's CastError to reject
// malformed ids (which surfaced as an uncontrolled 500 instead of a 400).
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}
