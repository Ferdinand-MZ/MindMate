import { Request, Response, NextFunction } from "express";
import { createInsight, getInsightsByUser } from "../models/Insight";
import { logger } from "../utils/logger";

// Create a new insight entry
export const createInsightHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, symptoms, solution } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    if (!name) {
      return res.status(400).json({ message: "name is required" });
    }

    const insight = await createInsight({
      userId,
      name,
      description,
      symptoms,
      solution,
    });
    logger.info(`Insight entry created for user ${userId}`);

    res.status(201).json({ success: true, data: insight });
  } catch (error) {
    next(error);
  }
};

// Get insights for a user
export const getUserInsights = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const insights = await getInsightsByUser(userId);
    res.status(200).json({ success: true, data: insights });
  } catch (error) {
    next(error);
  }
};
