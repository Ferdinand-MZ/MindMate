import mongoose, { Schema, Document } from "mongoose";

export interface ICommunityPost extends Document {
  // No userId stored — fully anonymous
  anonId: string; // hashed session token, so same user can manage their posts without being identified
  content: string;
  reactions: {
    heart: number;
    hug: number;
    strength: number;
    peace: number;
    sparkle: number;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const communityPostSchema = new Schema<ICommunityPost>(
  {
    anonId: { type: String, required: true, select: false }, // hidden from queries by default
    content: {
      type: String,
      required: true,
      maxlength: 280,
      trim: true,
    },
    reactions: {
      heart: { type: Number, default: 0 },
      hug: { type: Number, default: 0 },
      strength: { type: Number, default: 0 },
      peace: { type: Number, default: 0 },
      sparkle: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

communityPostSchema.index({ createdAt: -1, isActive: 1 });

export const CommunityPost = mongoose.model<ICommunityPost>(
  "CommunityPost",
  communityPostSchema
);
