import { Request, Response, NextFunction } from "express";
import { Insight } from "../models/Insight";
import { logger } from "../utils/logger";

// Create a new insight entry
export const createInsight = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, symptoms, solution } = req.body;
    const userId = req.user?._id; // From auth middleware

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const insight = new Insight({
      userId,
      name,
      description,
      symptoms,
      solution,
      timestamp: new Date(),
    });

    await insight.save();
    logger.info(`Insight entry created for user ${userId}`);

    res.status(201).json({
      success: true,
      data: insight,
    });
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
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const insights = await Insight.find({ userId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};