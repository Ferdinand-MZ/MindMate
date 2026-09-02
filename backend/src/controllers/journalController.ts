import { Request, Response, NextFunction } from "express";
import {
  createJournal,
  findTodayJournal,
  findJournalByIdAndUser,
  updateJournalContent,
  updateJournalAnalysis,
  getJournalHistory as getJournalHistoryRows,
} from "../models/Journal";
import { getMoodsSince } from "../models/Mood";
import {
  listRecentChatSessionsByUser,
  getThemesForSessions,
} from "../models/ChatSession";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const genAI = new GoogleGenAI({ apiKey: env.geminiApiKey });

async function geminiGenerate(prompt: string): Promise<string> {
  const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  return result.text?.trim() ?? "";
}

// ─── Generate a daily AI journal prompt ──────────────────────────────────────
export const getDailyPrompt = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoods = (await getMoodsSince(userId, sevenDaysAgo)).slice(0, 10);
    const recentSessions = await listRecentChatSessionsByUser(userId, 3);
    const uniqueThemes = [
      ...new Set(await getThemesForSessions(recentSessions.map((s) => s.id))),
    ].slice(0, 5);

    const avgMood =
      recentMoods.length > 0
        ? recentMoods.reduce((sum, m) => sum + m.score, 0) / recentMoods.length
        : null;

    const moodLabel =
      avgMood === null
        ? "neutral"
        : avgMood < 33
        ? "struggling"
        : avgMood < 66
        ? "mixed"
        : "positive";

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const existingToday = await findTodayJournal(userId, todayStart);

    if (existingToday) {
      return res.json({
        success: true,
        prompt: existingToday.prompt,
        journalId: existingToday.id,
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
- Do NOT include any intro like "Here's a prompt:" : just output the prompt itself
- Make it specific, not generic (e.g., not just "How are you feeling?")

Example prompts for different states:
- Stressed: "Ceritakan satu momen kecil minggu ini yang terasa lebih baik dari yang kamu bayangkan : seberapa pun kecilnya."
- Sad: "Jika perasaanmu saat ini bisa berbicara, apa yang ingin ia katakan padamu?"
- Positive: "Apa satu hal yang kamu lakukan untuk dirimu sendiri minggu ini yang ingin kamu ulangi?"`;

    const prompt = await geminiGenerate(aiPrompt);

    const journal = await createJournal({
      userId,
      prompt,
      themes: uniqueThemes,
      aiPromptContext: moodLabel,
    });

    res.json({
      success: true,
      prompt,
      journalId: journal.id,
      hasEntry: false,
      isExisting: false,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Save journal entry content ──────────────────────────────────────────────
export const saveJournalEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { journalId, content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    const journal = await findJournalByIdAndUser(journalId, userId);
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    const updated = await updateJournalContent(journal.id, content.trim());
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

// ─── Get journal history ──────────────────────────────────────────────────────
export const getJournalHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const limit = parseInt(req.query.limit as string) || 20;
    const journals = await getJournalHistoryRows(userId, Math.min(limit, 50));
    res.json({ success: true, data: journals });
  } catch (error) {
    next(error);
  }
};

// ─── Analyze journal entry with AI (opt-in) ───────────────────────────────────
export const analyzeJournalEntry = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { journalId } = req.body;
    if (!journalId) {
      return res.status(400).json({ message: "journalId is required" });
    }

    const journal = await findJournalByIdAndUser(journalId, userId);
    if (!journal) {
      return res.status(404).json({ message: "Journal entry not found" });
    }

    if (!journal.content?.trim()) {
      return res.status(400).json({ message: "Journal has no content to analyze" });
    }

    // Return cached analysis if already done
    if (journal.aiAnalysis) {
      return res.json({ success: true, analysis: journal.aiAnalysis });
    }

    const analysisPrompt = `You are MindMate, a compassionate mental wellness AI for Indonesian teenagers and college students.

Analyze this journal entry and respond ONLY with a valid JSON object (no markdown, no extra text):

Journal prompt: "${journal.prompt}"
Journal entry: "${journal.content}"

Respond with this exact JSON structure:
{
  "mood": "satu kata emosi dominan dalam bahasa Indonesia (misal: tenang, cemas, bersyukur, sedih, semangat)",
  "moodEmoji": "satu emoji yang cocok dengan mood",
  "themes": ["tema1", "tema2"],
  "insight": "2-3 kalimat hangat dan empatik tentang apa yang terlihat dari tulisan ini : bukan saran, tapi refleksi",
  "affirmation": "satu kalimat afirmasi singkat yang personal dan menyentuh, langsung ditujukan ke penulis"
}

Rules:
- themes: 2-3 kata kunci (dalam bahasa Indonesia, misal: "kelelahan", "hubungan", "ekspektasi diri")
- insight: hangat, seperti teman yang mengerti : bukan terapis. Jangan menyarankan sesuatu
- affirmation: pendek, kuat, personal berdasarkan isi tulisan
- Semua teks dalam bahasa Indonesia
- Output HANYA JSON mentah, tanpa \`\`\`json atau penjelasan apapun`;

    const raw = await geminiGenerate(analysisPrompt);

    let analysis: {
      mood: string;
      moodEmoji: string;
      themes: string[];
      insight: string;
      affirmation: string;
    };

    try {
      const cleaned = raw.replace(/```json|```/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch {
      logger.error("Failed to parse AI analysis JSON:", raw);
      return res.status(500).json({ message: "Failed to parse AI analysis" });
    }

    await updateJournalAnalysis(journal.id, analysis);
    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};
