import { Request, Response, NextFunction } from "express";
import {
  getOrCreateStreak,
  resetCurrentStreak,
  recordCheckIn as recordCheckInRow,
} from "../models/Streak";
import { findMoodInRange } from "../models/Mood";
import { findActivityInRange } from "../models/Activity";
import { logger } from "../utils/logger";

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
export const getStreak = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    let streak = await getOrCreateStreak(userId);

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Check actual activity today (mood or explicit check-in)
    const [todayMood, todayActivity] = await Promise.all([
      findMoodInRange(userId, startOfDay, endOfDay),
      findActivityInRange(userId, startOfDay, endOfDay),
    ]);
    const checkedInToday =
      !!(todayMood || todayActivity) ||
      (streak.lastCheckInDate ? isSameDay(streak.lastCheckInDate, now) : false);

    // Streak broken: last check-in is older than yesterday : reset atomically
    if (
      streak.lastCheckInDate &&
      !isSameDay(streak.lastCheckInDate, now) &&
      !isYesterday(streak.lastCheckInDate, now)
    ) {
      streak = await resetCurrentStreak(userId);
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
    next(error);
  }
};

// POST /api/streak/checkin
export const recordCheckIn = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const today = new Date();

    const streak = await getOrCreateStreak(userId);

    // Already checked in today : return current state without mutation
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

    const updated = await recordCheckInRow(userId, newStreak, newLongest, today);

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
    next(error);
  }
};
