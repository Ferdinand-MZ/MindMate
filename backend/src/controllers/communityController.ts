import { Request, Response, NextFunction } from "express";
import {
  getActivePosts,
  countActivePosts,
  createPostRateLimited,
  reactToPost as reactToPostRow,
  findPostByIdWithOwner,
  deactivatePost,
  isValidUuid,
} from "../models/CommunityPost";
import { logger } from "../utils/logger";
import { env } from "../config/env";
import crypto from "crypto";

// Create a stable anonymous ID from user id (one-way hash)
function makeAnonId(userId: string): string {
  return crypto
    .createHmac("sha256", env.anonSecret)
    .update(userId)
    .digest("hex")
    .slice(0, 16);
}

// ─── Content safety filter ────────────────────────────────────────────────────
// Blocks content containing high-risk self-harm or crisis language.
const BLOCKED_PATTERNS = [
  /\b(mau|ingin|pengen|akan|mo)\s+(bunuh\s+diri|mati|mengakhiri\s+hidup)\b/i,
  /\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die)\b/i,
  /\bself[\s-]?harm\b/i,
  /\bmenyakiti\s+diri\b/i,
  /\birisan|menyayat|nyayat\b/i,
  /\b(overdosis|overdose|minum\s+obat\s+banyak)\b/i,
  /\b(gantung\s+diri|loncat|lompat\s+dari)\b/i,
];

function getBlockedReason(text: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) return pattern.source;
  }
  return null;
}

const CRISIS_REDIRECT = `Hei, kami perhatikan postinganmu. Jika kamu sedang tidak baik-baik saja, tolong hubungi Into The Light di 119 ext 8 : mereka siap mendengarkan 24 jam. 💙`;

// ─── Get recent posts ─────────────────────────────────────────────────────────
export const getPosts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const offset = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      getActivePosts(limit, offset),
      countActivePosts(),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ─── Create a post ────────────────────────────────────────────────────────────
export const createPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (content.trim().length > 280) {
      return res.status(400).json({ message: "Max 280 characters" });
    }

    const blockedReason = getBlockedReason(content);
    if (blockedReason) {
      logger.warn(`Community post blocked for user ${userId}: pattern matched`);
      return res.status(422).json({
        blocked: true,
        message: CRISIS_REDIRECT,
        crisis: true,
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const anonId = makeAnonId(userId);

    // Rate limit (max 5/day) enforced atomically via an advisory lock +
    // transaction : fixes both the previous full-collection-scan check and
    // the TOCTOU race that let concurrent requests bypass the cap.
    const post = await createPostRateLimited(anonId, content.trim(), 5, todayStart);
    if (!post) {
      return res.status(429).json({ message: "Maksimal 5 postingan per hari" });
    }

    res.status(201).json({
      success: true,
      data: { ...post, isOwner: true },
    });
  } catch (error) {
    next(error);
  }
};

// ─── React to a post ──────────────────────────────────────────────────────────
export const reactToPost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { postId } = req.params;
    const { reaction } = req.body;

    if (!isValidUuid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }

    const validReactions = ["heart", "hug", "strength", "peace", "sparkle"];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const reactions = await reactToPostRow(postId, reaction);
    if (!reactions) return res.status(404).json({ message: "Post not found" });

    res.json({ success: true, reactions });
  } catch (error) {
    next(error);
  }
};

// ─── Delete own post ──────────────────────────────────────────────────────────
export const deletePost = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    if (!isValidUuid(postId)) {
      return res.status(400).json({ message: "Invalid post id" });
    }
    const anonId = makeAnonId(userId);

    const post = await findPostByIdWithOwner(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.anonId !== anonId) {
      return res.status(403).json({ message: "Not your post" });
    }

    await deactivatePost(postId);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};
