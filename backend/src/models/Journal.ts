import mongoose, { Schema, Document } from "mongoose";

export interface IJournalAnalysis {
  mood: string;
  moodEmoji: string;
  themes: string[];
  insight: string;
  affirmation: string;
}

export interface IJournal extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  content: string;
  moodScore?: number;
  themes?: string[];
  aiPromptContext?: string;
  aiAnalysis?: IJournalAnalysis;   // cached opt-in AI analysis result
  createdAt: Date;
  updatedAt: Date;
}

const journalSchema = new Schema<IJournal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    prompt: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    moodScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    themes: [{ type: String }],
    aiPromptContext: { type: String },
    aiAnalysis: {
      mood: { type: String },
      moodEmoji: { type: String },
      themes: [{ type: String }],
      insight: { type: String },
      affirmation: { type: String },
    },
  },
  { timestamps: true }
);

journalSchema.index({ userId: 1, createdAt: -1 });

export const Journal = mongoose.model<IJournal>("Journal", journalSchema);