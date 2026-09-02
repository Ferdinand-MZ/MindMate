import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { serve } from "inngest/express";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/logger";
import { env } from "./config/env";
import authRouter from "./routes/auth";
import chatRouter from "./routes/chat";
import moodRouter from "./routes/mood";
import activityRouter from "./routes/activity";
import insightRouter from "./routes/insight";
import journalRouter from "./routes/journal";
import communityRouter from "./routes/community";
import progressRouter from "./routes/progress";
import streakRouter from "./routes/streak";
import moodPatternsRouter from "./routes/moodPatterns";
import { connectDB } from "./utils/db";
import { inngest } from "./inngest/client";
import { functions as inngestFunctions } from "./inngest/functions";

const app = express();

// ── Security middleware ────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS : allow frontend origin ──────────────────────────────────────────────
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin || env.allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// ── Inngest endpoint ──────────────────────────────────────────────────────────
app.use("/api/inngest", serve({ client: inngest, functions: inngestFunctions }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "MindMate API is running" });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/auth", authRouter);
app.use("/chat", chatRouter);
app.use("/api/mood", moodRouter);
app.use("/api/activity", activityRouter);
app.use("/api/insight", insightRouter);
app.use("/api/journal", journalRouter);
app.use("/api/community", communityRouter);
app.use("/api/progress", progressRouter);
app.use("/api/streak", streakRouter);
app.use("/api/mood-patterns", moodPatternsRouter);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();
    const PORT = env.port;
    app.listen(PORT, () => {
      logger.info(`MindMate server running on port ${PORT}`);
      logger.info(`Inngest endpoint: http://localhost:${PORT}/api/inngest`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();