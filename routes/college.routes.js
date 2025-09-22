import { Router } from "express";
import { 
    getAllColleges, 
    getCollegeById, 
    updateCollege, 
    deleteCollege, 
    downloadCollegeDocument
} from "../controllers/college.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Public routes (no auth needed)
router.get("/", getAllColleges);
router.get("/:id", getCollegeById);

// Protected routes (require JWT verification)
router.put("/:id", verifyJWT, updateCollege);
router.delete("/:id", verifyJWT, deleteCollege);

// File download
router.get("/:id/documents/:index", verifyJWT, downloadCollegeDocument);

export default router;
