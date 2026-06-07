import express from "express";
import { auth } from "../middleware/auth";
import {
  getDailyPrompt,
  saveJournalEntry,
  getJournalHistory,
  analyzeJournalEntry,
} from "../controllers/journalController";

const router = express.Router();
router.use(auth);

router.get("/prompt", getDailyPrompt);
router.post("/entry", saveJournalEntry);
router.get("/history", getJournalHistory);
router.post("/analyze", analyzeJournalEntry);  // opt-in AI analysis

export default router;