import mongoose, { Schema, Document } from "mongoose";

export interface IJournal extends Document {
  userId: mongoose.Types.ObjectId;
  prompt: string;
  content: string;
  moodScore?: number;
  themes?: string[];
  aiPromptContext?: string; // what triggered this prompt
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
  },
  { timestamps: true }
);

journalSchema.index({ userId: 1, createdAt: -1 });

export const Journal = mongoose.model<IJournal>("Journal", journalSchema);
