import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { createUser, findUserByEmailWithPassword } from "../models/User";
import { createSession, deleteSessionByToken } from "../models/Session";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }
    if (!EMAIL_RE.test(email)) {
      return res.status(400).json({ message: "Invalid email address." });
    }
    if (typeof password !== "string" || password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let user;
    try {
      user = await createUser(name, email, hashedPassword);
    } catch (err: any) {
      // Postgres unique_violation : handles the register race where two
      // concurrent requests for the same email both pass an earlier check.
      if (err?.code === "23505") {
        return res.status(409).json({ message: "Email already in use." });
      }
      throw err;
    }

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      message: "User registered successfully.",
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await findUserByEmailWithPassword(email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user.id }, env.jwtSecret, {
      expiresIn: "24h",
    });

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await createSession(
      user.id,
      token,
      expiresAt,
      req.headers["user-agent"] as string | undefined
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
      message: "Login successful",
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (token) {
      await deleteSessionByToken(token);
    }
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};
