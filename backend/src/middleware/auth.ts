import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { findUserById } from "../models/User";
import { findActiveSessionByToken } from "../models/Session";
import { env } from "../config/env";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: { id: string; name: string; email: string };
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };

    // Check the session store, not just the JWT signature : a deleted
    // session (logout) or an expired one now actually invalidates the
    // token instead of remaining valid until its natural JWT expiry.
    const session = await findActiveSessionByToken(token);
    if (!session) {
      return res.status(401).json({ message: "Session expired or invalidated" });
    }

    // Only the safe fields (no password hash) ever land on req.user.
    const user = await findUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: user.id, name: user.name, email: user.email };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid authentication token" });
  }
};
