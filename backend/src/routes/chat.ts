import express from "express";
import {
  createChatSession,
  getChatSession,
  sendMessage,
  getChatHistory,
} from "../controllers/chat";
import { auth } from "../middleware/auth";
import { getAllChatSessions, deleteChatSession } from "../controllers/chat";


const router = express.Router();

// Apply auth middleware to all routes
router.use(auth);


router.get("/sessions", getAllChatSessions);


// Create a new chat session
router.post("/sessions", createChatSession);

// Get a specific chat session
router.get("/sessions/:sessionId", getChatSession);

// Send a message in a chat session
router.post("/sessions/:sessionId/messages", sendMessage);

// Get chat history for a session
router.get("/sessions/:sessionId/history", getChatHistory);

// Delete a chat session
router.delete("/sessions/:sessionId", deleteChatSession);

export default router;

// let response = pm.response.json()
// pm.globals.set("access_token", response.access_token)
