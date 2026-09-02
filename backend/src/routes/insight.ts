import express from "express";
import { auth } from "../middleware/auth";
import { createInsightHandler, getUserInsights } from "../controllers/insightController";

const router = express.Router();

// All routes are protected with authentication
router.use(auth);

// Create a new insight entry
router.post("/", createInsightHandler);

// Get user insights
router.get("/", getUserInsights); // Changed from "/insight" to "/"

export default router;