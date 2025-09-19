import express, { Request, Response } from "express";
import {serve} from "inngest/express"
import {inngest} from "./inngest/index"
import {functions as inggestFunctions} from "./inngest/functions"
import {logger} from "./utils/logger"
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import authRoutes from "./routes/auth"
import { errorHandler } from "./middleware/errorHandler";

dotenv.config()
const app = express();

// middleware
app.use(cors()); // Mengaktifkan CORS untuk semua route
app.use(helmet()); // Menyetel security-related HTTP headers
app.use(morgan("dev")); // Log HTTP requests ke console

// Parse JSON
app.use(express.json());

// set up endpoint inggest
app.use("/api/inngest", serve({client: inngest, functions:inggestFunctions}))

// error handling
app.use(errorHandler)

// routes
app.use("/auth", authRoutes)

// start Server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Then start the server
    const PORT = process.env.PORT || 3001;
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(
        `Inngest endpoint available at http://localhost:${PORT}/api/inngest`
      );
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer(1)

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.get("/api/chat", (req: Request, res: Response) => {
  res.send("Halo, Apa yang saya bisa bantu hari ini?");
});

const startServer = async() => {
  try {
    const PORT = process.env.PORT || 3001
    app.listen(PORT, () => {
      logger.info(`Server Berjalan di port ${PORT}`)
      logger.info(
        `Endpoint Inngest tersedia di http://localhost:${PORT}/api/inngest`
      )
    })
  } catch (error) {
    logger.error("Gagal memulai server : ", error)
    process.exit(1) //process 1 akan langsung mengehentikan proces. 1 = true
  }
}

startServer()

// app.listen(PORT, () => {
//   console.log(`✅ Server berjalan di port ${PORT}`);
// });
