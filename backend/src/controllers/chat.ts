// src/controllers/chat.ts
import { Request, Response } from "express";
import { ChatSession } from "../models/ChatSession";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { logger } from "../utils/logger";
import { inngest } from "../inngest/client";
import { User } from "../models/User";
import { InngestEvent } from "../types/inngest";
import { Types } from "mongoose";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in .env");
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// ─── Helper: get user id as string robustly from req.user ─────────────────────
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

// ─── Helper: call Gemini with exponential back-off on 429 ─────────────────────
async function geminiGenerate(prompt: string, retries = 3, delayMs = 1500): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await genAI.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      return result.text?.trim() ?? "";
    } catch (err: any) {
      const isRateLimit =
        err?.message?.includes("429") ||
        err?.message?.includes("RATE_LIMIT_EXCEEDED");
      const isLastAttempt = attempt === retries;
      if (isRateLimit && !isLastAttempt) {
        logger.warn(
          `Gemini rate limit hit, retrying in ${delayMs}ms (attempt ${attempt + 1}/${retries})`
        );
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw new Error("Gemini request failed after retries");
}

// ─── Helper: safely parse JSON from Gemini (strips markdown fences) ───────────
function safeParseJSON<T>(text: string, fallback: T): T {
  const clean = text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  // Extract first { ... } block
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return fallback;
  try {
    return JSON.parse(match[0]) as T;
  } catch {
    return fallback;
  }
}

// ─── System prompt for teen/college MindMate therapy context ──────────────────
const SYSTEM_PROMPT = `You are MindMate, a compassionate AI mental health companion designed for teenagers and college students.

Your role:
- Offer empathetic, non-judgmental support in a warm, relatable tone (not overly clinical)
- Use evidence-based CBT, DBT, and mindfulness techniques adapted for young adults
- Validate feelings before offering perspective or advice
- Ask thoughtful follow-up questions to understand the user better
- Gently identify academic stress, social pressure, identity issues, burnout, or anxiety
- Encourage professional help when risk indicators are present (self-harm, suicidal ideation)
- ALWAYS respond in the same language the user writes in (Bahasa Indonesia or English)
- Keep responses conversational and supportive — not lecture-y

Safety rules:
- If riskLevel >= 7: immediately encourage the user to reach out to a trusted adult, counselor, or crisis line (Indonesia: 119 ext 8)
- Never give medical diagnoses or medication advice
- Maintain confidentiality framing`;

// ─── Create a new chat session ─────────────────────────────────────────────────
export const createChatSession = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User not authenticated" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const sessionId = uuidv4();
    const session = new ChatSession({
      sessionId,
      userId,
      startTime: new Date(),
      status: "active",
      messages: [],
    });
    await session.save();
    res.status(201).json({
      message: "Chat session created successfully",
      sessionId: session.sessionId,
    });
  } catch (error) {
    logger.error("Error creating chat session:", error);
    res.status(500).json({
      message: "Error creating chat session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ─── Send a message ───────────────────────────────────────────────────────────
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    logger.info("Processing message:", { sessionId, message });

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ── Fetch weather data (non-blocking) ────────────────────────────────────
    let weatherContext = "";
    try {
      const apiKey = process.env.OPENWEATHERMAP_API_KEY;
      if (apiKey) {
        const city = "Jakarta";
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl, { timeout: 3000 });
        const wd = weatherResponse.data;
        weatherContext = `Current weather in ${city}: ${wd.weather[0].description}, ${wd.main.temp}°C.`;
      }
    } catch {
      // Weather is a nice-to-have; don't block the chat
      weatherContext = "";
    }

    // ── Send Inngest event (non-blocking, fire-and-forget) ────────────────────
    const event: InngestEvent = {
      name: "therapy/session.message",
      data: {
        message,
        history: session.messages,
        memory: {
          userProfile: { emotionalState: [], riskLevel: 0, preferences: {} },
          sessionContext: { conversationThemes: [], currentTechnique: null },
        },
        goals: [],
        systemPrompt: SYSTEM_PROMPT,
      },
    };
    inngest.send(event).catch((e) => logger.warn("Inngest send failed:", e));

    // ── Build conversation history context for Gemini ─────────────────────────
    const recentHistory = session.messages
      .slice(-10)
      .map((m) => `${m.role === "user" ? "User" : "MindMate"}: ${m.content}`)
      .join("\n");

    // ── Analysis prompt ───────────────────────────────────────────────────────
    const analysisPrompt = `You are analyzing a therapy chat message from a teenager/college student for MindMate.
Return ONLY a valid JSON object (no markdown, no explanation).

Message: "${message}"
${weatherContext ? `Weather context: ${weatherContext}` : ""}
Recent conversation:
${recentHistory || "(new session)"}

JSON schema:
{
  "emotionalState": "string (e.g., anxious, sad, hopeful, neutral)",
  "themes": ["array of strings, e.g., academic stress, loneliness"],
  "riskLevel": <integer 0-10, where 0=no risk, 10=crisis>,
  "recommendedApproach": "string (e.g., validation + CBT reframing)",
  "progressIndicators": ["array of positive/negative indicators"],
  "weatherInfluence": "string or null"
}`;

    interface AnalysisResult {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
      weatherInfluence: string;
    }

    const defaultAnalysis: AnalysisResult = {
      emotionalState: "unknown",
      themes: [],
      riskLevel: 0,
      recommendedApproach: "empathetic listening",
      progressIndicators: [],
      weatherInfluence: "none",
    };

    let analysis: AnalysisResult = defaultAnalysis;
    try {
      const analysisText = await geminiGenerate(analysisPrompt);
      analysis = safeParseJSON<AnalysisResult>(analysisText, defaultAnalysis);
    } catch (err) {
      logger.warn("Analysis generation failed, using defaults:", err);
    }

    logger.info("Message analysis:", analysis);

    // ── Safety check: high risk → prepend crisis notice ───────────────────────
    let crisisPrefix = "";
    if (analysis.riskLevel >= 7) {
      crisisPrefix =
        "⚠️ Saya sangat khawatir dengan keselamatanmu. Tolong hubungi seseorang yang kamu percaya atau layanan krisis (Indonesia: 119 ext 8) sekarang.\n\n";
    }

    // ── Response generation ───────────────────────────────────────────────────
    const responsePrompt = `${SYSTEM_PROMPT}

Recent conversation:
${recentHistory || "(new session)"}

User's latest message: "${message}"
Emotional state detected: ${analysis.emotionalState}
Themes: ${analysis.themes.join(", ") || "general"}
Risk level: ${analysis.riskLevel}/10
Recommended approach: ${analysis.recommendedApproach}
${weatherContext ? `Weather context: ${weatherContext}` : ""}

Respond naturally and helpfully as MindMate. Be warm, concise (2-4 paragraphs max), and end with a thoughtful question or gentle suggestion.`;

    let aiResponse = "";
    try {
      aiResponse = await geminiGenerate(responsePrompt);
    } catch (err: any) {
      logger.error("Response generation failed:", err);
      const isQuota =
        err?.message?.includes("429") || err?.message?.includes("quota");
      aiResponse = isQuota
        ? "Maaf, saya sedang sangat sibuk sekarang. Coba lagi dalam beberapa menit ya! 😊"
        : "Maaf, ada kendala teknis. Coba kirim pesanmu lagi ya.";
    }

    const finalResponse = crisisPrefix + aiResponse;

    // ── Persist messages ──────────────────────────────────────────────────────
    session.messages.push({
      role: "user",
      content: message,
      timestamp: new Date(),
    });

    session.messages.push({
      role: "assistant",
      content: finalResponse,
      timestamp: new Date(),
      metadata: {
        analysis,
        progress: {
          emotionalState: analysis.emotionalState,
          riskLevel: analysis.riskLevel,
          weatherInfluence: analysis.weatherInfluence || "none",
        },
      },
    });

    await session.save();
    logger.info("Session updated:", { sessionId });

    res.json({
      response: finalResponse,
      message: finalResponse,
      analysis,
      metadata: {
        progress: {
          emotionalState: analysis.emotionalState,
          riskLevel: analysis.riskLevel,
          weatherInfluence: analysis.weatherInfluence || "none",
        },
      },
    });
  } catch (error) {
    logger.error("Error in sendMessage:", error);
    res.status(500).json({
      message: "Error processing message",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// ─── Get specific chat session ─────────────────────────────────────────────────
export const getChatSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const chatSession = await ChatSession.findOne({ sessionId });
    if (!chatSession) {
      return res.status(404).json({ error: "Chat session not found" });
    }
    res.json(chatSession);
  } catch (error) {
    logger.error("Failed to get chat session:", error);
    res.status(500).json({ error: "Failed to get chat session" });
  }
};

// ─── Get chat history ──────────────────────────────────────────────────────────
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const session = await ChatSession.findOne({ sessionId });
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(session.messages);
  } catch (error) {
    logger.error("Error fetching chat history:", error);
    res.status(500).json({ message: "Error fetching chat history" });
  }
};

// ─── Get all sessions ──────────────────────────────────────────────────────────
export const getAllChatSessions = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const sessions = await ChatSession.find({ userId })
      .select("sessionId startTime status messages createdAt updatedAt")
      .sort({ startTime: -1 });

    return res.status(200).json(sessions);
  } catch (error) {
    logger.error("Error fetching chat sessions:", error);
    return res.status(500).json({ message: "Error fetching chat sessions" });
  }
};

// ─── Delete a session ──────────────────────────────────────────────────────────
export const deleteChatSession = async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await ChatSession.deleteOne({ sessionId });
    res.status(200).json({ message: "Chat session deleted successfully" });
  } catch (error) {
    logger.error("Error deleting chat session:", error);
    res.status(500).json({
      message: "Error deleting chat session",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
