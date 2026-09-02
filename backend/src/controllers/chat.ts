// src/controllers/chat.ts
import { Request, Response, NextFunction } from "express";
import {
  createChatSession as createChatSessionRow,
  findChatSessionByIdAndUser,
  listChatMessages,
  addChatMessage,
  listChatSessionsByUser,
  deleteChatSession as deleteChatSessionRow,
} from "../models/ChatSession";
import { findUserById } from "../models/User";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { inngest } from "../inngest/client";
import { InngestEvent } from "../types/inngest";
import axios from "axios";
import { env } from "../config/env";

const genAI = new GoogleGenAI({ apiKey: env.geminiApiKey });

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
- Keep responses conversational and supportive : not lecture-y

Safety rules:
- If riskLevel >= 7: immediately encourage the user to reach out to a trusted adult, counselor, or crisis line (Indonesia: 119 ext 8)
- Never give medical diagnoses or medication advice
- Maintain confidentiality framing`;

// ─── Create a new chat session ─────────────────────────────────────────────────
export const createChatSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized - User not authenticated" });
    }
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const session = await createChatSessionRow(userId);
    res.status(201).json({
      message: "Chat session created successfully",
      sessionId: session.id,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Send a message ───────────────────────────────────────────────────────────
export const sendMessage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ message: "Message is required" });
    }

    logger.info("Processing message:", { sessionId, message });

    const session = await findChatSessionByIdAndUser(sessionId, userId);
    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    const priorMessages = await listChatMessages(sessionId);

    // ── Fetch weather data (non-blocking) ────────────────────────────────────
    let weatherContext = "";
    try {
      const apiKey = env.openWeatherMapApiKey;
      if (apiKey) {
        const city = "Jakarta";
        const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
        const weatherResponse = await axios.get(weatherUrl, { timeout: 3000 });
        const wd = weatherResponse.data;
        weatherContext = `Current weather in ${city}: ${wd.weather[0].description}, ${wd.main.temp}°C.`;
      }
    } catch {
      weatherContext = "";
    }

    // ── Fire-and-forget event log (kept purely for observability : the
    //    duplicate synchronous Gemini call this used to trigger via
    //    aiFunctions.processChatMessage has been removed; its result was
    //    discarded and it doubled AI cost/latency per message) ──────────────
    const event: InngestEvent = {
      name: "therapy/session.message",
      data: {
        message,
        history: priorMessages,
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
    const recentHistory = priorMessages
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
    // Insert-only into chat_messages, rather than rewriting a growing
    // embedded array on every message.
    await addChatMessage(sessionId, "user", message);
    await addChatMessage(sessionId, "assistant", finalResponse, {
      analysis,
      progress: {
        emotionalState: analysis.emotionalState,
        riskLevel: analysis.riskLevel,
        weatherInfluence: analysis.weatherInfluence || "none",
      },
    });
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
    next(error);
  }
};

// ─── Get specific chat session ─────────────────────────────────────────────────
export const getChatSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    // Ownership enforced in the query itself : fixes the IDOR where this
    // endpoint previously returned any user's session given its id.
    const session = await findChatSessionByIdAndUser(sessionId, userId);
    if (!session) {
      return res.status(404).json({ error: "Chat session not found" });
    }
    const messages = await listChatMessages(sessionId);
    res.json({ ...session, messages });
  } catch (error) {
    next(error);
  }
};

// ─── Get chat history ──────────────────────────────────────────────────────────
export const getChatHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const session = await findChatSessionByIdAndUser(sessionId, userId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    const messages = await listChatMessages(sessionId);
    res.json(messages);
  } catch (error) {
    next(error);
  }
};

// ─── Get all sessions ──────────────────────────────────────────────────────────
export const getAllChatSessions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const sessions = await listChatSessionsByUser(userId);
    return res.status(200).json(sessions);
  } catch (error) {
    next(error);
  }
};

// ─── Delete a session ──────────────────────────────────────────────────────────
export const deleteChatSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const session = await findChatSessionByIdAndUser(sessionId, userId);
    if (!session) {
      return res.status(404).json({ message: "Chat session not found" });
    }

    await deleteChatSessionRow(sessionId);
    res.status(200).json({ message: "Chat session deleted successfully" });
  } catch (error) {
    next(error);
  }
};
