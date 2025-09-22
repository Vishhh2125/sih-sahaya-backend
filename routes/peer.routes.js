import { Router } from "express";
import { createPeer, assignStudents } from "../controllers/peer.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Admin-only in future; currently secured by JWT
router.post("/", verifyJWT, createPeer);
router.put("/:id/students", verifyJWT, assignStudents);

export default router;


