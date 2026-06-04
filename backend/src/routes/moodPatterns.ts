import express from "express";
import { auth } from "../middleware/auth";
import { getWeeklyMoodPattern } from "../controllers/moodPatternController";

const router = express.Router();
router.use(auth);

router.get("/weekly", getWeeklyMoodPattern);

export default router;