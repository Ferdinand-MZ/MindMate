import { Request, Response } from "express";
import { Streak } from "../models/Streak";
import { Mood } from "../models/Mood";
import { Activity } from "../models/Activity";
import { logger } from "../utils/logger";
import { Types } from "mongoose";

function getUserId(req: Request): Types.ObjectId | null {
  const user = req.user;
  if (!user) return null;
  const raw = user.id ?? user._id;
  if (!raw) return null;
  try {
    return new Types.ObjectId(raw.toString());
  } catch {
    return null;
  }
}

// Compare calendar dates only (ignores time-of-day entirely)
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// True if `date` is the calendar day before `today`
function isYesterday(date: Date, today: Date): boolean {
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  return isSameDay(date, yesterday);
}

// GET /api/streak
export const getStreak = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let streak = await Streak.findOne({ userId });
    if (!streak) {
      streak = await Streak.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCheckInDate: null,
        totalCheckIns: 0,
      });
    }

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Check actual activity today (mood or explicit check-in)
    const [todayMood, todayActivity] = await Promise.all([
      Mood.findOne({ userId, timestamp: { $gte: startOfDay, $lte: endOfDay } }),
      Activity.findOne({ userId, timestamp: { $gte: startOfDay, $lte: endOfDay } }),
    ]);
    const checkedInToday =
      !!(todayMood || todayActivity) ||
      (streak.lastCheckInDate ? isSameDay(streak.lastCheckInDate, now) : false);

    // Streak broken: last check-in is older than yesterday — reset atomically
    // Use findOneAndUpdate to avoid race condition between read and write
    if (
      streak.lastCheckInDate &&
      !isSameDay(streak.lastCheckInDate, now) &&
      !isYesterday(streak.lastCheckInDate, now)
    ) {
      streak = await Streak.findOneAndUpdate(
        { userId },
        { $set: { currentStreak: 0 } },
        { new: true }
      ) ?? streak;
    }

    res.json({
      success: true,
      data: {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalCheckIns: streak.totalCheckIns,
        lastCheckInDate: streak.lastCheckInDate,
        checkedInToday,
      },
    });
  } catch (error) {
    logger.error("Error fetching streak:", error);
    res.status(500).json({ message: "Error fetching streak" });
  }
};

// POST /api/streak/checkin
export const recordCheckIn = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Normalise "today" to start-of-day for consistent date comparisons
    const today = new Date();

    let streak = await Streak.findOne({ userId });
    if (!streak) {
      streak = await Streak.create({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCheckInDate: null,
        totalCheckIns: 0,
      });
    }

    // Already checked in today — return current state without mutation
    if (streak.lastCheckInDate && isSameDay(streak.lastCheckInDate, today)) {
      return res.json({
        success: true,
        data: {
          currentStreak: streak.currentStreak,
          longestStreak: streak.longestStreak,
          totalCheckIns: streak.totalCheckIns,
          alreadyCheckedIn: true,
          milestoneReached: false,
        },
      });
    }

    // Determine new streak value
    let newStreak: number;
    if (streak.lastCheckInDate && isYesterday(streak.lastCheckInDate, today)) {
      newStreak = streak.currentStreak + 1; // consecutive day
    } else {
      newStreak = 1; // first check-in or streak broken
    }

    const newLongest = Math.max(streak.longestStreak, newStreak);

    // Atomic update — avoids race conditions between concurrent requests
    const updated = await Streak.findOneAndUpdate(
      { userId },
      {
        $set: {
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastCheckInDate: today,
        },
        $inc: { totalCheckIns: 1 },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(500).json({ message: "Failed to update streak" });
    }

    logger.info(`Streak updated for user ${userId}: ${updated.currentStreak} days`);

    const MILESTONES = [3, 7, 14, 30, 60, 100];
    res.json({
      success: true,
      data: {
        currentStreak: updated.currentStreak,
        longestStreak: updated.longestStreak,
        totalCheckIns: updated.totalCheckIns,
        alreadyCheckedIn: false,
        milestoneReached: MILESTONES.includes(updated.currentStreak),
      },
    });
  } catch (error) {
    logger.error("Error recording check-in:", error);
    res.status(500).json({ message: "Error recording check-in" });
  }
};