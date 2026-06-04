import express from "express";
import { auth } from "../middleware/auth";
import { createMood, getMoodHistory, getTodayMoods } from "../controllers/moodController";

const router = express.Router();

router.use(auth);

// POST /api/mood — log a mood entry
router.post("/", createMood);

// GET /api/mood — fetch mood history (supports ?limit=N)
router.get("/", getMoodHistory);

// GET /api/mood/today — fetch today's moods
router.get("/today", getTodayMoods);

export default router;
