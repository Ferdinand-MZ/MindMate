import { Request, Response, NextFunction } from "express";
import { getMoodsSince } from "../models/Mood";
import { getActivitiesSince } from "../models/Activity";
import { logger } from "../utils/logger";
import { GoogleGenAI } from "@google/genai";
import { env } from "../config/env";

const genAI = new GoogleGenAI({ apiKey: env.geminiApiKey });

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const HOUR_LABELS: Record<number, string> = {
  6: "pagi", 9: "pagi", 12: "siang", 15: "sore", 18: "sore", 21: "malam", 0: "malam",
};

// ─── In-memory cache: userId → { data, cachedAt } ────────────────────────────
// Cached per user, invalidated after 6 hours. NOTE: this is process-local :
// it will not be shared across horizontally-scaled instances, and is only
// intended as a single-instance dev/small-deployment optimization. A sweep
// on every write keeps it from growing unbounded (the previous version had
// no eviction at all, a slow memory leak over the process lifetime).
interface CacheEntry {
  data: object;
  cachedAt: number;
}
const PATTERN_CACHE = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function setCache(key: string, data: object) {
  for (const [k, v] of PATTERN_CACHE) {
    if (Date.now() - v.cachedAt >= CACHE_TTL_MS) PATTERN_CACHE.delete(k);
  }
  PATTERN_CACHE.set(key, { data, cachedAt: Date.now() });
}

// GET /api/mood-patterns/weekly
export const getWeeklyMoodPattern = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const cacheKey = userId;
    const cached = PATTERN_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
      logger.info(`Mood pattern cache hit for user ${cacheKey}`);
      return res.json({ success: true, data: cached.data, cached: true });
    }

    const now = new Date();
    const fourWeeksAgo = new Date(now);
    fourWeeksAgo.setDate(now.getDate() - 28);

    const [moods, activities] = await Promise.all([
      getMoodsSince(userId, fourWeeksAgo),
      getActivitiesSince(userId, fourWeeksAgo),
    ]);
    // getMoodsSince/getActivitiesSince sort descending; this analysis wants
    // ascending order.
    moods.reverse();
    activities.reverse();

    if (moods.length < 5) {
      return res.json({
        success: true,
        data: {
          summary: "Catat suasana hatimu selama beberapa hari lagi agar kami bisa menemukan pola yang berarti untukmu! 🌱",
          worstDayOfWeek: null,
          bestDayOfWeek: null,
          worstTimeOfDay: null,
          bestTimeOfDay: null,
          helpfulActivities: [],
          thisWeekAvg: null,
          lastWeekAvg: null,
          totalMoodEntries: moods.length,
          generatedAt: new Date(),
        },
      });
    }

    // Aggregate by day of week
    const dayScores: Record<number, number[]> = {};
    for (let d = 0; d < 7; d++) dayScores[d] = [];
    moods.forEach((m) => {
      dayScores[new Date(m.timestamp).getDay()].push(m.score);
    });

    const dayAverages = Object.entries(dayScores)
      .filter(([, scores]) => scores.length > 0)
      .map(([day, scores]) => ({
        day: parseInt(day),
        name: DAY_NAMES[parseInt(day)],
        avg: scores.reduce((a, b) => a + b, 0) / scores.length,
        count: scores.length,
      }))
      .sort((a, b) => a.avg - b.avg);

    const worstDay = dayAverages[0] ?? null;
    const bestDay = dayAverages[dayAverages.length - 1] ?? null;

    // Aggregate by hour bucket
    const BUCKETS = [0, 6, 9, 12, 15, 18, 21];
    const hourBuckets: Record<number, number[]> = {};
    BUCKETS.forEach((h) => (hourBuckets[h] = []));
    moods.forEach((m) => {
      const hour = new Date(m.timestamp).getHours();
      const bucket = BUCKETS.reduce((prev, curr) =>
        Math.abs(curr - hour) < Math.abs(prev - hour) ? curr : prev
      );
      hourBuckets[bucket].push(m.score);
    });
    const hourAverages = Object.entries(hourBuckets)
      .filter(([, s]) => s.length > 0)
      .map(([h, s]) => ({ hour: parseInt(h), avg: s.reduce((a, b) => a + b, 0) / s.length }))
      .sort((a, b) => a.avg - b.avg);

    const worstHour = hourAverages[0] ?? null;
    const bestHour = hourAverages[hourAverages.length - 1] ?? null;

    // Activities that correlate with high mood (score >= 65, within ±24h)
    const highMoodTimestamps = moods
      .filter((m) => m.score >= 65)
      .map((m) => m.timestamp.getTime());

    const activityCounts: Record<string, number> = {};
    activities.forEach((a) => {
      const t = a.timestamp.getTime();
      const nearHighMood = highMoodTimestamps.some((hmt) => Math.abs(hmt - t) <= 86400000);
      if (nearHighMood) {
        activityCounts[a.type] = (activityCounts[a.type] || 0) + 1;
      }
    });
    const helpfulActivities = Object.entries(activityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type]) => type);

    // Week-over-week trend
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(now.getDate() - 14);

    const thisWeekMoods = moods.filter((m) => m.timestamp >= oneWeekAgo);
    const lastWeekMoods = moods.filter((m) => m.timestamp >= twoWeeksAgo && m.timestamp < oneWeekAgo);
    const thisWeekAvg = thisWeekMoods.length
      ? thisWeekMoods.reduce((a, m) => a + m.score, 0) / thisWeekMoods.length
      : null;
    const lastWeekAvg = lastWeekMoods.length
      ? lastWeekMoods.reduce((a, m) => a + m.score, 0) / lastWeekMoods.length
      : null;

    // AI narrative (inside try : never block the response)
    let summary = "";
    try {
      const prompt = `Kamu adalah MindMate, asisten kesehatan mental yang hangat dan suportif untuk remaja Indonesia.

Berikut pola suasana hati pengguna dalam 4 minggu terakhir:
- Hari terburuk: ${worstDay ? `${worstDay.name} (rata-rata ${worstDay.avg.toFixed(0)}/100)` : "belum cukup data"}
- Hari terbaik: ${bestDay ? `${bestDay.name} (rata-rata ${bestDay.avg.toFixed(0)}/100)` : "belum cukup data"}
- Waktu terburuk: ${worstHour ? `${worstHour.hour}:00 (${HOUR_LABELS[worstHour.hour] ?? ""})` : "belum cukup data"}
- Waktu terbaik: ${bestHour ? `${bestHour.hour}:00 (${HOUR_LABELS[bestHour.hour] ?? ""})` : "belum cukup data"}
- Aktivitas yang tampak membantu: ${helpfulActivities.length ? helpfulActivities.join(", ") : "belum ada data aktivitas"}
- Rata-rata minggu ini: ${thisWeekAvg ? thisWeekAvg.toFixed(0) : "N/A"}/100
- Rata-rata minggu lalu: ${lastWeekAvg ? lastWeekAvg.toFixed(0) : "N/A"}/100

Tulis ringkasan 2-3 kalimat yang:
1. Menyebutkan pola spesifik yang terdeteksi (hari/waktu terburuk) dengan empati
2. Mengakui aktivitas yang membantu jika ada
3. Memberikan satu saran konkret yang bisa dicoba minggu ini
Gunakan bahasa Indonesia yang hangat, informal, dan menyemangati. Jangan terlalu klinis.`;

      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      summary = result.text?.trim() ?? "";
    } catch (err) {
      logger.warn("Mood pattern AI generation failed, using fallback:", err);
      summary = worstDay
        ? `Kamu cenderung merasa kurang baik pada hari ${worstDay.name}. Coba rencanakan aktivitas menyenangkan di hari itu minggu depan! 💪`
        : "Terus catat suasana hatimu : kami akan menemukan pola yang berguna buatmu!";
    }

    const data = {
      summary,
      worstDayOfWeek: worstDay,
      bestDayOfWeek: bestDay,
      worstTimeOfDay: worstHour,
      bestTimeOfDay: bestHour,
      helpfulActivities,
      thisWeekAvg,
      lastWeekAvg,
      totalMoodEntries: moods.length,
      generatedAt: new Date(),
    };

    setCache(cacheKey, data);

    res.json({ success: true, data, cached: false });
  } catch (error) {
    next(error);
  }
};
