import { Router } from "express";
import { 
    getAllCollegeAdmins, 
    getCollegeAdminById, 
    getCollegeAdminByUserId,
    updateCollegeAdmin, 
    deleteCollegeAdmin, 
    downloadCollegeAdminProof 
} from "../controllers/collegeAdmin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Protected routes (require JWT verification)
router.get("/", verifyJWT, getAllCollegeAdmins);
router.get("/:id", verifyJWT, getCollegeAdminById);
router.get("/user/:userId", verifyJWT, getCollegeAdminByUserId);
router.put("/:id", verifyJWT, updateCollegeAdmin);
router.delete("/:id", verifyJWT, deleteCollegeAdmin);

// File download
router.get("/:id/proof", verifyJWT, downloadCollegeAdminProof);

export default router;
