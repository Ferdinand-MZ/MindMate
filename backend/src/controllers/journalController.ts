import { Request, Response } from "express";
import { Journal } from "../models/Journal";
import { Mood } from "../models/Mood";
import { ChatSession } from "../models/ChatSession";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { Types } from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

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

async function geminiGenerate(prompt: string): Promise<string> {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return result.text?.trim() ?? "";
}

// ─── Generate a daily AI journal prompt ──────────────────────────────────────
export const getDailyPrompt = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Gather recent mood data (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoods = await Mood.find({
      userId,
      timestamp: { $gte: sevenDaysAgo },
    })
      .sort({ timestamp: -1 })
      .limit(10);

    // Gather recent chat themes
    const recentSessions = await ChatSession.find({ userId })
      .sort({ startTime: -1 })
      .limit(3)
      .select("messages");

    const allThemes: string[] = [];
    recentSessions.forEach((session) => {
      session.messages.forEach((msg) => {
        if (msg.metadata?.analysis?.themes) {
          allThemes.push(...msg.metadata.analysis.themes);
        }
      });
    });

    const avgMood =
      recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length
        : null;

    const uniqueThemes = [...new Set(allThemes)].slice(0, 5);
    const moodLabel =
      avgMood === null
        ? "neutral"
        : avgMood < 33
        ? "struggling"
        : avgMood < 66
        ? "mixed"
        : "positive";

    // Check if already has prompt today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existingToday = await Journal.findOne({
      userId,
      createdAt: { $gte: todayStart },
    });

    if (existingToday) {
      return res.json({
        success: true,
        prompt: existingToday.prompt,
        journalId: existingToday._id,
        hasEntry: !!existingToday.content,
        isExisting: true,
      });
    }

    const aiPrompt = `You are MindMate, a compassionate AI for teenagers and college students.
    
Generate ONE thoughtful, specific journal prompt for today based on this context:
- User's average mood this week: ${moodLabel} (score: ${avgMood?.toFixed(0) ?? "unknown"}/100)
- Recent themes in their conversations: ${uniqueThemes.length > 0 ? uniqueThemes.join(", ") : "general wellbeing"}

Rules:
- The prompt must be warm, non-threatening, and introspective
- It should gently relate to their recent emotional state
- Keep it to 1-2 sentences maximum
- Write in Indonesian (Bahasa Indonesia)
- Do NOT include any intro like "Here's a prompt:" — just output the prompt itself
- Make it specific, not generic (e.g., not just "How are you feeling?")

Example prompts for different states:
- Stressed: "Ceritakan satu momen kecil minggu ini yang terasa lebih baik dari yang kamu bayangkan — seberapa pun kecilnya."
- Sad: "Jika perasaanmu saat ini bisa berbicara, apa yang ingin ia katakan padamu?"
- Positive: "Apa satu hal yang kamu lakukan untuk dirimu sendiri minggu ini yang ingin kamu ulangi?"`;

    const prompt = await geminiGenerate(aiPrompt);

    const journal = new Journal({
      userId,
      prompt,
      content: "",
      themes: uniqueThemes,
      aiPromptContext: moodLabel,
    });

    await journal.save();

    res.json({
      success: true,
      prompt,
      journalId: journal._id,
      hasEntry: false,
      isExisting: false,
    });
  } catch (error) {
    logger.error("Error generating journal prompt:", error);
    res.status(500).json({ message: "Error generating prompt" });
  }
};

// ─── Save journal entry content ──────────────────────────────────────────────
export const saveJournalEntry = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { journalId, content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const journal = await Journal.findOne({ _id: journalId, userId });
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    journal.content = content.trim();
    await journal.save();

    res.json({ success: true, data: journal });
  } catch (error) {
    logger.error("Error saving journal entry:", error);
    res.status(500).json({ message: "Error saving entry" });
  }
};

// ─── Get journal history ──────────────────────────────────────────────────────
export const getJournalHistory = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const limit = parseInt(req.query.limit as string) || 20;
    const journals = await Journal.find({ userId, content: { $ne: "" } })
      .sort({ createdAt: -1 })
      .limit(Math.min(limit, 50))
      .select("-__v");

    res.json({ success: true, data: journals });
  } catch (error) {
    logger.error("Error fetching journal history:", error);
    res.status(500).json({ message: "Error fetching journals" });
  }
};
