import { Router } from "express";
import { 
    getAllCounselors, 
    getCounselorById, 
    getCounselorsByCollege,
    createCounselor, 
    updateCounselor, 
    deleteCounselor,
    updateCounselorStatus
} from "../controllers/counselor.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Protected routes (require JWT verification)
router.get("/",  getAllCounselors);
router.get("/college/:collegeId",  getCounselorsByCollege);
router.get("/:id", getCounselorById);
router.post("/", verifyJWT, createCounselor);
router.put("/:id", verifyJWT, updateCounselor);
router.put("/:id/status", verifyJWT, updateCounselorStatus);
router.delete("/:id", verifyJWT, deleteCounselor);

export default router;
