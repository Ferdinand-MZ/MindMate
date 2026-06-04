import { Request, Response } from "express";
import { CommunityPost } from "../models/CommunityPost";
import { logger } from "../utils/logger";
import crypto from "crypto";

// Create a stable anonymous ID from user id (one-way hash)
function makeAnonId(userId: string): string {
  return crypto
    .createHmac("sha256", process.env.ANON_SECRET || "mindmate-anon-salt")
    .update(userId)
    .digest("hex")
    .slice(0, 16);
}

// ─── Content safety filter ────────────────────────────────────────────────────
// Blocks content containing high-risk self-harm or crisis language.
// Returns the matched term if blocked, null if safe.
const BLOCKED_PATTERNS = [
  // Suicide / self-harm intent (Indonesian + English)
  /\b(mau|ingin|pengen|akan|mo)\s+(bunuh\s+diri|mati|mengakhiri\s+hidup)\b/i,
  /\b(suicide|kill\s+myself|end\s+my\s+life|want\s+to\s+die)\b/i,
  /\bself[\s-]?harm\b/i,
  /\bmenyakiti\s+diri\b/i,
  /\birisan|menyayat|nyayat\b/i,
  // Explicit method mentions
  /\b(overdosis|overdose|minum\s+obat\s+banyak)\b/i,
  /\b(gantung\s+diri|loncat|lompat\s+dari)\b/i,
];

function getBlockedReason(text: string): string | null {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) return pattern.source;
  }
  return null;
}

const CRISIS_REDIRECT = `Hei, kami perhatikan postinganmu. Jika kamu sedang tidak baik-baik saja, tolong hubungi Into The Light di 119 ext 8 — mereka siap mendengarkan 24 jam. 💙`;

// ─── Get recent posts ─────────────────────────────────────────────────────────
export const getPosts = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const posts = await CommunityPost.find({ isActive: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("content reactions createdAt");

    const total = await CommunityPost.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: posts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    logger.error("Error fetching community posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};

// ─── Create a post ────────────────────────────────────────────────────────────
export const createPost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id ?? req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }
    if (content.trim().length > 280) {
      return res.status(400).json({ message: "Max 280 characters" });
    }

    // ── Safety filter ────────────────────────────────────────────────────────
    const blockedReason = getBlockedReason(content);
    if (blockedReason) {
      logger.warn(`Community post blocked for user ${userId}: pattern matched`);
      // Return 422 with a crisis redirect message instead of a generic error
      return res.status(422).json({
        blocked: true,
        message: CRISIS_REDIRECT,
        crisis: true,
      });
    }

    // ── Rate limit: max 5 posts per day per user ──────────────────────────────
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const anonId = makeAnonId(userId.toString());

    const todayPosts = await (CommunityPost as any)
      .find({ createdAt: { $gte: todayStart } })
      .select("+anonId");
    const todayCount = todayPosts.filter((p: any) => p.anonId === anonId).length;

    if (todayCount >= 5) {
      return res.status(429).json({ message: "Maksimal 5 postingan per hari" });
    }

    const post = new CommunityPost({
      anonId,
      content: content.trim(),
    });

    await post.save();

    const safe = {
      _id: post._id,
      content: post.content,
      reactions: post.reactions,
      createdAt: post.createdAt,
      isOwner: true,
    };

    res.status(201).json({ success: true, data: safe });
  } catch (error) {
    logger.error("Error creating community post:", error);
    res.status(500).json({ message: "Error creating post" });
  }
};

// ─── React to a post ──────────────────────────────────────────────────────────
export const reactToPost = async (req: Request, res: Response) => {
  try {
    const { postId } = req.params;
    const { reaction } = req.body;

    const validReactions = ["heart", "hug", "strength", "peace", "sparkle"];
    if (!validReactions.includes(reaction)) {
      return res.status(400).json({ message: "Invalid reaction type" });
    }

    const post = await CommunityPost.findByIdAndUpdate(
      postId,
      { $inc: { [`reactions.${reaction}`]: 1 } },
      { new: true }
    ).select("reactions");

    if (!post) return res.status(404).json({ message: "Post not found" });

    res.json({ success: true, reactions: post.reactions });
  } catch (error) {
    logger.error("Error reacting to post:", error);
    res.status(500).json({ message: "Error reacting to post" });
  }
};

// ─── Delete own post ──────────────────────────────────────────────────────────
export const deletePost = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id ?? req.user?._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { postId } = req.params;
    const anonId = makeAnonId(userId.toString());

    const post = await CommunityPost.findById(postId).select("+anonId");
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.anonId !== anonId) {
      return res.status(403).json({ message: "Not your post" });
    }

    post.isActive = false;
    await post.save();

    res.json({ success: true });
  } catch (error) {
    logger.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post" });
  }
};