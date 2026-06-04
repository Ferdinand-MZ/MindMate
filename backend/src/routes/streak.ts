import express from "express";
import { auth } from "../middleware/auth";
import { getStreak, recordCheckIn } from "../controllers/streakController";

const router = express.Router();
router.use(auth);

router.get("/", getStreak);
router.post("/checkin", recordCheckIn);

export default router;