import { pool } from "../utils/db";

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

function mapUser(row: any): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserWithPassword(row: any): UserWithPassword {
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export async function createUser(
  name: string,
  email: string,
  passwordHash: string
): Promise<User> {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *`,
    [name, email, passwordHash]
  );
  return mapUser(rows[0]);
}

// Includes password_hash : only for the login flow. Never pass this
// through to req.user or a JSON response.
export async function findUserByEmailWithPassword(
  email: string
): Promise<UserWithPassword | null> {
  const { rows } = await pool.query(`SELECT * FROM users WHERE email = $1`, [
    email,
  ]);
  return rows[0] ? mapUserWithPassword(rows[0]) : null;
}

// Safe projection : no password_hash. Used by auth middleware and anywhere
// else that just needs identity.
export async function findUserById(id: string): Promise<User | null> {
  const { rows } = await pool.query(
    `SELECT id, name, email, created_at, updated_at FROM users WHERE id = $1`,
    [id]
  );
  return rows[0] ? mapUser(rows[0]) : null;
}
