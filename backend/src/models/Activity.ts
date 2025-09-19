import mongoose, {Document, Schema} from "mongoose";

export interface IActivity extends Document {
    userId: mongoose.Types.ObjectId;
    type: string;
    name: string
    description: string
    duration: number
    timestamp: Date
}