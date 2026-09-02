import express from "express";
import { auth } from "../middleware/auth";
import {
  logActivity,
  getTodayActivities,
  getAllActivitiesHandler,
  getTotalActivities,
} from "../controllers/activityController";

const router = express.Router();

router.use(auth);

// POST /api/activity : log a new activity
router.post("/", logActivity);

// GET /api/activity/today : today's activities
router.get("/today", getTodayActivities);

// GET /api/activity/all : all activities (paginated)
router.get("/all", getAllActivitiesHandler);

// GET /api/activity/count : total count
router.get("/count", getTotalActivities);

// Legacy path kept for backward compat
router.get("/activities/count", getTotalActivities);

export default router;
