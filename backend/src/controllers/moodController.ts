import { Request, Response, NextFunction } from "express";
import { createMood as createMoodRow, getMoodHistory as getMoodHistoryRows } from "../models/Mood";
import { getMoodsInRange } from "../models/Mood";
import { logger } from "../utils/logger";
import { sendMoodUpdateEvent } from "../utils/inngestEvents";

// Create a new mood entry
export const createMood = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { score, note, context, activities } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (typeof score !== "number" || score < 0 || score > 100) {
      return res.status(400).json({ message: "Score must be a number between 0 and 100" });
    }

    const mood = await createMoodRow({ userId, score, note, context, activities });
    logger.info(`Mood entry created for user ${userId}`);

    await sendMoodUpdateEvent({
      userId,
      mood: score,
      note,
      context,
      activities,
      timestamp: mood.timestamp,
    }).catch((e) => logger.warn("Inngest mood event failed:", e));

    res.status(201).json({ success: true, data: mood });
  } catch (error) {
    next(error);
  }
};

// Get mood history for a user (last 30 entries by default)
export const getMoodHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const limit = parseInt(req.query.limit as string) || 30;
    const moods = await getMoodHistoryRows(userId, Math.min(limit, 100));
    res.json({ success: true, data: moods });
  } catch (error) {
    next(error);
  }
};

// Get today's mood entries
export const getTodayMoods = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const moods = await getMoodsInRange(userId, startOfDay, endOfDay);
    res.json({ success: true, data: moods });
  } catch (error) {
    next(error);
  }
};
