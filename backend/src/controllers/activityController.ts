import { Request, Response, NextFunction } from "express";
import { Activity } from "../models/Activity";
import { logger } from "../utils/logger";
import { sendActivityCompletionEvent } from "../utils/inngestEvents";

const getUID = (req: Request) => req.user?._id ?? req.user?.id;

// Log a new activity
export const logActivity = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { type, name, description, duration, difficulty, feedback } = req.body;
    const userId = getUID(req);

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!type || !name) {
      return res.status(400).json({ message: "type and name are required" });
    }

    const activity = new Activity({
      userId,
      type,
      name,
      description,
      duration,
      difficulty,
      feedback,
      timestamp: new Date(),
    });

    await activity.save();
    logger.info(`Activity logged for user ${userId}`);

    sendActivityCompletionEvent({
      userId,
      id: activity._id,
      type: activity.type, // normalized by model setter
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
    const userId = getUID(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const activities = await Activity.find({
      userId,
      timestamp: { $gte: startOfDay, $lte: endOfDay },
    }).sort({ timestamp: -1 });

    res.json({ success: true, data: activities });
  } catch (error) {
    next(error);
  }
};

// Get all activities for a user
export const getAllActivities = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = getUID(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const activities = await Activity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, 200));

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
    const userId = getUID(req);
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const totalActivities = await Activity.countDocuments({ userId });
    res.status(200).json({ totalActivities });
  } catch (error) {
    next(error);
  }
};
