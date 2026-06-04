// src/models/ChatSession.ts
import { Schema, model, Document, Types } from "mongoose";

export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    analysis?: {
      emotionalState: string;
      themes: string[];
      riskLevel: number;
      recommendedApproach: string;
      progressIndicators: string[];
      weatherInfluence?: string;
    };
    progress: {
      emotionalState: string;
      riskLevel: number;
      weatherInfluence?: string;
    };
  };
}

export interface IChatSession extends Document {
  sessionId: string;
  userId: Types.ObjectId;
  startTime: Date;
  status: string;
  messages: IChatMessage[];
}

const chatSessionSchema = new Schema<IChatSession>({
  sessionId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  startTime: { type: Date, required: true },
  status: { type: String, required: true },
  messages: [
    {
      role: { type: String, enum: ["user", "assistant"], required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, required: true },
      metadata: {
        analysis: {
          emotionalState: { type: String },
          themes: [{ type: String }],
          riskLevel: { type: Number },
          recommendedApproach: { type: String },
          progressIndicators: [{ type: String }],
          weatherInfluence: { type: String, default: "none" },
        },
        progress: {
          emotionalState: { type: String },
          riskLevel: { type: Number },
          weatherInfluence: { type: String, default: "none" },
        },
      },
    },
  ],
});

export const ChatSession = model<IChatSession>("ChatSession", chatSessionSchema);