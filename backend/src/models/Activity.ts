import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  name: string;
  description?: string;
  duration?: number;
  difficulty?: string;
  feedback?: string;
  timestamp: Date;
}

// Maps Indonesian display names → canonical English enum values
const TYPE_ALIAS_MAP: Record<string, string> = {
  // English originals
  meditation: "meditation",
  exercise: "exercise",
  walking: "walking",
  reading: "reading",
  journaling: "journaling",
  therapy: "therapy",
  // Indonesian aliases
  meditasi: "meditation",
  olahraga: "exercise",
  jalan: "walking",
  "jalan kaki": "walking",
  membaca: "reading",
  jurnal: "journaling",
  terapi: "therapy",
};

const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      // Normalize before save — accepts Indonesian or English
      set: (val: string) =>
        TYPE_ALIAS_MAP[val?.toLowerCase()] ?? val?.toLowerCase(),
      enum: [
        "meditation",
        "exercise",
        "walking",
        "reading",
        "journaling",
        "therapy",
      ],
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    duration: {
      type: Number,
      min: 0,
    },
    difficulty: {
      type: String,
    },
    feedback: {
      type: String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ userId: 1, timestamp: -1 });

export const Activity = mongoose.model<IActivity>("Activity", activitySchema);
