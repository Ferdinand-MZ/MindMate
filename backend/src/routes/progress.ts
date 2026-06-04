import express from "express";
import { auth } from "../middleware/auth";
import { getProgressReport } from "../controllers/progressController";

const router = express.Router();
router.use(auth);

router.get("/", getProgressReport);

export default router;
