import { Request, Response, NextFunction } from "express";
import { getMoodsInRange } from "../models/Mood";
import { listChatSessionsInRange, getMessagesForSessions } from "../models/ChatSession";
import { getJournalsInRange } from "../models/Journal";
import { getInsightsInRange } from "../models/Insight";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const genAI = new GoogleGenAI({ apiKey: env.geminiApiKey });

// ─── In-memory cache: "userId:month" → { data, cachedAt } ────────────────────
// Progress report cached for 1 hour. Process-local only (see the equivalent
// note in moodPatternController) : swept on every write to bound growth.
interface ProgressCacheEntry { data: object; cachedAt: number; }
const PROGRESS_CACHE = new Map<string, ProgressCacheEntry>();
const PROGRESS_TTL_MS = 60 * 60 * 1000; // 1 hour

function setCache(key: string, data: object) {
  for (const [k, v] of PROGRESS_CACHE) {
    if (Date.now() - v.cachedAt >= PROGRESS_TTL_MS) PROGRESS_CACHE.delete(k);
  }
  PROGRESS_CACHE.set(key, { data, cachedAt: Date.now() });
}

export const getProgressReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const monthParamRaw = req.query.month as string;
    const cacheKey = userId + ":" + (monthParamRaw || "current");
    const cached = PROGRESS_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < PROGRESS_TTL_MS) {
      logger.info(`Progress report cache hit: ${cacheKey}`);
      return res.json({ success: true, data: cached.data, cached: true });
    }

    // Get month range (default: current month, or ?month=YYYY-MM)
    const monthParam = monthParamRaw;
    let startDate: Date, endDate: Date;

    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [year, month] = monthParam.split("-").map(Number);
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0, 23, 59, 59);
    } else {
      const now = new Date();
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // Fetch all data in parallel
    const [moods, sessions, journals, insights] = await Promise.all([
      getMoodsInRange(userId, startDate, endDate),
      listChatSessionsInRange(userId, startDate, endDate),
      getJournalsInRange(userId, startDate, endDate),
      getInsightsInRange(userId, startDate, endDate),
    ]);
    const messages = await getMessagesForSessions(sessions.map((s) => s.id));

    // Mood stats
    const moodScores = moods.map((m) => m.score);
    const avgMood =
      moodScores.length > 0
        ? moodScores.reduce((a, b) => a + b, 0) / moodScores.length
        : null;
    const minMood = moodScores.length > 0 ? Math.min(...moodScores) : null;
    const maxMood = moodScores.length > 0 ? Math.max(...moodScores) : null;

    // Mood trend (weekly averages) : buckets by actual calendar week (the
    // week the 1st of the month falls in counts as week 1), fixing the
    // previous day-of-month / 7 bucketing which misaligned with real week
    // boundaries.
    const startDow = startDate.getDay();
    const weeklyMoods: { week: number; avg: number; count: number }[] = [];
    for (let w = 0; w < 6; w++) {
      const weekMoods = moods.filter((m) => {
        const day = new Date(m.timestamp).getDate();
        const week = Math.floor((day - 1 + startDow) / 7);
        return week === w;
      });
      if (weekMoods.length > 0) {
        weeklyMoods.push({
          week: w + 1,
          avg: weekMoods.reduce((a, m) => a + m.score, 0) / weekMoods.length,
          count: weekMoods.length,
        });
      }
    }

    // Theme frequency from chat messages
    const themeCount: Record<string, number> = {};
    messages.forEach((msg) => {
      const themes = msg.metadata?.analysis?.themes;
      if (Array.isArray(themes)) {
        themes.forEach((theme) => {
          themeCount[theme] = (themeCount[theme] || 0) + 1;
        });
      }
    });
    const topThemes = Object.entries(themeCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, count]) => ({ theme, count }));

    const totalMessages = messages.length;

    // AI narrative summary
    let aiSummary = "";
    try {
      const summaryPrompt = `You are MindMate, creating a compassionate monthly mental health summary for a user.

    Data this month:
    - Mood check-ins: ${moods.length} entries
    - Average mood score: ${avgMood?.toFixed(0) ?? "N/A"}/100
    - Chat sessions: ${sessions.length}
    - Journal entries written: ${journals.length}
    - Top emotional themes: ${topThemes.map((t) => t.theme).join(", ") || "None recorded"}
    - CBT insights completed: ${insights.length}

    Write a warm, encouraging 3-4 sentence summary that:
    1. Acknowledges their effort in tracking their mental health
    2. Highlights 1-2 specific positive patterns or improvements (be specific to the data)
    3. Gently notes areas to work on
    4. Ends with an encouraging forward-looking statement
    Write in Indonesian (Bahasa Indonesia). Be warm and personal, not clinical.`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: summaryPrompt,
      });

      aiSummary = result.text?.trim() || "";
    } catch (err) {
      logger.warn("AI summary generation failed:", err);
      aiSummary =
        "Terima kasih sudah merawat kesehatan mentalmu bulan ini. Setiap langkah kecil sangat berarti!";
    }

    const report = {
      period: {
        start: startDate,
        end: endDate,
        label: startDate.toLocaleDateString("id-ID", {
          month: "long",
          year: "numeric",
        }),
      },
      mood: {
        totalEntries: moods.length,
        average: avgMood ? Math.round(avgMood) : null,
        min: minMood,
        max: maxMood,
        weeklyTrend: weeklyMoods,
        dailyData: moods.map((m) => ({
          date: m.timestamp,
          score: m.score,
          note: m.note,
        })),
      },
      sessions: {
        total: sessions.length,
        totalMessages,
        topThemes,
      },
      journals: {
        total: journals.length,
        entries: journals.map((j) => ({
          date: j.createdAt,
          prompt: j.prompt,
          preview: j.content.slice(0, 100) + (j.content.length > 100 ? "…" : ""),
        })),
      },
      insights: {
        total: insights.length,
      },
      aiSummary,
      generatedAt: new Date(),
    };

    setCache(cacheKey, report);
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};
