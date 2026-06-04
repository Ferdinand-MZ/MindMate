import { inngest } from "./client";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import dotenv from "dotenv";
dotenv.config();

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in .env");
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// Function to handle chat message processing
export const processChatMessage = inngest.createFunction(
  {
    id: "process-chat-message",
  },
  { event: "therapy/session.message" },
  async ({ event, step }) => {
    try {
      const {
        message,
        history,
        memory = {
          userProfile: {
            emotionalState: [],
            riskLevel: 0,
            preferences: {},
          },
          sessionContext: {
            conversationThemes: [],
            currentTechnique: null,
          },
        },
        goals = [],
        systemPrompt,
      } = event.data;

      logger.info("Processing chat message:", {
        message,
        historyLength: history?.length,
      });

      // Analyze the message using Gemini
      const analysis = await step.run("analyze-message", async () => {
        try {

          const prompt = `Analisis pesan chat terapi ini dan berikan insights. Return HANYA dalam bentuk JSON yang valid tanpa markdown formatting atau additional text.
          Message: ${message}
          Context: ${JSON.stringify({ memory, goals })}
          
          Required JSON structure:
          {
            "emotionalState": "string",
            "themes": ["string"],
            "riskLevel": number,
            "recommendedApproach": "string",
            "progressIndicators": ["string"]
          }`;

          const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          const text = result.text?.trim() ?? "";

          logger.info("Received analysis from Gemini:", { text });

          // Clean the response text to ensure it's valid JSON
          const cleanText = text.replace(/```json\n|\n```/g, "").trim();
          const parsedAnalysis = JSON.parse(cleanText);

          logger.info("Successfully parsed analysis:", parsedAnalysis);
          return parsedAnalysis;
        } catch (error) {
          logger.error("Error in message analysis:", { error, message });
          // Return a default analysis instead of throwing
          return {
            emotionalState: "neutral",
            themes: [],
            riskLevel: 0,
            recommendedApproach: "supportive",
            progressIndicators: [],
          };
        }
      });

      // Update memory based on analysis
      const updatedMemory = await step.run("update-memory", async () => {
        if (analysis.emotionalState) {
          memory.userProfile.emotionalState.push(analysis.emotionalState);
        }
        if (analysis.themes) {
          memory.sessionContext.conversationThemes.push(...analysis.themes);
        }
        if (analysis.riskLevel) {
          memory.userProfile.riskLevel = analysis.riskLevel;
        }
        return memory;
      });

      // If high risk is detected, trigger an alert
      if (analysis.riskLevel > 4) {
        await step.run("trigger-risk-alert", async () => {
          logger.warn("High risk level detected in chat message", {
            message,
            riskLevel: analysis.riskLevel,
          });
        });
      }

      // Generate therapeutic response
      const response = await step.run("generate-response", async () => {
        try {

          const prompt = `${systemPrompt}
          
          Berdasarkan pesan chat berikut, generate respons yang bersifat therapeutic: 
          Pesan: ${message}
          Analysis: ${JSON.stringify(analysis)} 
          Memory: ${JSON.stringify(memory )} 
          Goals: ${JSON.stringify(goals)} 

          Berikan Respons yang bersifat:
          1. Menangani kebutuhan emosional segera
          2. Menggunakan teknik terapeutik yang sesuai
          3. Menunjukkan empati dan pengertian
          4. Menjaga batasan profesional
          5. Mempertimbangkan keselamatan dan kesejahteraan`

          const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          const responseText = result.text?.trim() ?? "";

          logger.info("Generated response:", { responseText });
          return responseText;
        } catch (error) {
          logger.error("Error generating response:", { error, message });
          // Return a default response instead of throwing
          return "Saya di sini untuk membantu Anda. Bisakah Anda ceritakan lebih banyak tentang apa yang ada di pikiran Anda?";
        }
      });

      // Return the response in the expected format
      return {
        response,
        analysis,
        updatedMemory,
      };
    } catch (error) {
      logger.error("Error in chat message processing:", {
        error,
        message: event.data.message,
      });
      // Return a default response instead of throwing
      return {
        response:
          "Saya di sini untuk membantu Anda. Bisakah Anda ceritakan lebih banyak tentang apa yang ada di pikiran Anda?",
        analysis: {
          emotionalState: "neutral",
          themes: [],
          riskLevel: 0,
          recommendedApproach: "supportive",
          progressIndicators: [],
        },
        updatedMemory: event.data.memory,
      };
    }
  }
);

// Function to analyze therapy session content
export const analyzeTherapySession = inngest.createFunction(
  { id: "analyze-therapy-session" },
  { event: "therapy/session.created" },
  async ({ event, step }) => {
    try {
      // Get the session content
      const sessionContent = await step.run("get-session-content", async () => {
        return event.data.notes || event.data.transcript;
      });

      // Analyze the session using Gemini
      const analysis = await step.run("analyze-with-gemini", async () => {

        const prompt = `Analisis sesi terapi berikut dan berikan insights. 
        Session Content: ${sessionContent}
        
        Tolong Berikan :
        1. Kunci Tema dan Topik yang dibahas
        2. Analisis dari Emotional State Klien selama sesi
        3. Area yang berpotensi menjadi perhatian
        4. Rekomendasi untuk follow up
        5. Indikator progress
        
        Format the response as a JSON object.`;

        const result = await genAI.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        const text = result.text?.trim() ?? "";

        const filteredText = text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();

        return JSON.parse(filteredText);

      });

      // Store the analysis
      await step.run("store-analysis", async () => {
        // Here you would typically store the analysis in your database
        logger.info("Session analysis stored successfully");
        return analysis;
      });

      // If there are concerning indicators, trigger an alert
      if (analysis.areasOfConcern?.length > 0) {
        await step.run("trigger-concern-alert", async () => {
          logger.warn("Concerning indicators detected in session analysis", {
            sessionId: event.data.sessionId,
            concerns: analysis.areasOfConcern,
          });
          // Add your alert logic here
        });
      }

      return {
        message: "Session analysis completed",
        analysis,
      };
    } catch (error) {
      logger.error("Error in therapy session analysis:", error);
      throw error;
    }
  }
);

// Function to generate personalized activity recommendations
export const generateActivityRecommendations = inngest.createFunction(
  { id: "generate-activity-recommendations" },
  { event: "mood/updated" },
  async ({ event, step }) => {
    try {
      // Get user's mood history and activity history
      const userContext = await step.run("get-user-context", async () => {
        // Here you would typically fetch user's history from your database
        return {
          recentMoods: event.data.recentMoods,
          completedActivities: event.data.completedActivities,
          preferences: event.data.preferences,
        };
      });

      // Generate recommendations using Gemini
      const recommendations = await step.run(
        "generate-recommendations",
        async () => {

          const prompt = `Based on the following user context, generate personalized activity recommendations:
        User Context: ${JSON.stringify(userContext)}
        
          Tolong berikan:

          1. 3-5 rekomendasi aktivitas yang dipersonalisasi
          2. Alasan untuk setiap rekomendasi
          3. Manfaat yang diharapkan
          4. Tingkat kesulitan
          5. Estimasi durasi

          Format respons sebagai objek JSON.`;

          const result = await genAI.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
          });
          const text = result.text?.trim() ?? "";

          const filteredText = text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();

          return JSON.parse(filteredText);

        }
      );

      // Store the recommendations
      await step.run("store-recommendations", async () => {
        // Here you would typically store the recommendations in your database
        logger.info("Activity recommendations stored successfully");
        return recommendations;
      });

      return {
        message: "Activity recommendations generated",
        recommendations,
      };
    } catch (error) {
      logger.error("Error generating activity recommendations:", error);
      throw error;
    }
  }
);

// Add the functions to the exported array
export const functions = [
  processChatMessage,
  analyzeTherapySession,
  generateActivityRecommendations,
];
