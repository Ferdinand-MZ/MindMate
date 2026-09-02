import { Request, Response, NextFunction } from "express";
import {
  createActivity,
  getActivitiesInRange,
  getAllActivities,
  countActivities,
} from "../models/Activity";
import { logger } from "../utils/logger";
import { sendActivityCompletionEvent } from "../utils/inngestEvents";

// Log a new activity
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, name, description, duration, difficulty, feedback } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!type || !name) {
      return res.status(400).json({ message: "type and name are required" });
    }

    const activity = await createActivity({
      userId,
      type,
      name,
      description,
      duration,
      difficulty,
      feedback,
    });
    logger.info(`Activity logged for user ${userId}`);

    sendActivityCompletionEvent({
      userId,
      id: activity.id,
      type: activity.type,
      name,
      duration,
      difficulty,
      feedback,
      timestamp: activity.timestamp,
    }).catch((e) => logger.warn("Inngest activity event failed:", e));

    res.status(201).json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

// Get today's activities
export const getTodayActivities = async (
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

    const activities = await getActivitiesInRange(userId, startOfDay, endOfDay);
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// Get all activities for a user
export const getAllActivitiesHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const activities = await getAllActivities(userId, Math.min(limit, 200));
    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// Get total activity count
export const getTotalActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const totalActivities = await countActivities(userId);
    res.status(200).json({ totalActivities });
  } catch (error) {
    next(error);
  }
};
