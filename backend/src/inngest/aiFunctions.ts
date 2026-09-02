import { inngest } from "./client";
import { GoogleGenAI } from "@google/genai";
import { logger } from "../utils/logger";
import { env } from "../config/env";

const genAI = new GoogleGenAI({ apiKey: env.geminiApiKey });

// NOTE: a "process-chat-message" handler on "therapy/session.message" used
// to live here, duplicating almost exactly what controllers/chat.ts#sendMessage
// already does synchronously (its result was never awaited or persisted :
// pure wasted Gemini calls, 2x cost/latency per message). Removed; the
// synchronous controller call is the single source of truth for the reply.

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
export const functions = [analyzeTherapySession, generateActivityRecommendations];
