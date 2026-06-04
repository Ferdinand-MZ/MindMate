import express from "express";
import { auth } from "../middleware/auth";
import {
  getDailyPrompt,
  saveJournalEntry,
  getJournalHistory,
} from "../controllers/journalController";

const router = express.Router();
router.use(auth);

router.get("/prompt", getDailyPrompt);
router.post("/entry", saveJournalEntry);
router.get("/history", getJournalHistory);

export default router;
