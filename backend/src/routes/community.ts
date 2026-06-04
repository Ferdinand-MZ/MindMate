import express from "express";
import { auth } from "../middleware/auth";
import {
  getPosts,
  createPost,
  reactToPost,
  deletePost,
} from "../controllers/communityController";

const router = express.Router();

// Public: read posts (still needs auth so we can flag own posts)
router.get("/posts", auth, getPosts);
router.post("/posts", auth, createPost);
router.post("/posts/:postId/react", auth, reactToPost);
router.delete("/posts/:postId", auth, deletePost);

export default router;
