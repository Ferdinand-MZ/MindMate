import mongoose, { Document, Schema } from "mongoose";

export interface IStreak extends Document {
  userId: mongoose.Types.ObjectId;
  currentStreak: number;
  longestStreak: number;
  lastCheckInDate: Date | null;
  totalCheckIns: number;
  updatedAt: Date;
}

const StreakSchema = new Schema<IStreak>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCheckInDate: { type: Date, default: null },
    totalCheckIns: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const Streak = mongoose.model<IStreak>("Streak", StreakSchema);