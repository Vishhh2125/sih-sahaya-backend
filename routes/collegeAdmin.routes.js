import { Router } from "express";
import { 
    getAllCollegeAdmins, 
    getCollegeAdminById, 
    getCollegeAdminByUserId,
    updateCollegeAdmin, 
    deleteCollegeAdmin 
} from "../controllers/collegeAdmin.controller.js";

const router = Router();

router.get("/", getAllCollegeAdmins);
router.get("/:id", getCollegeAdminById);
router.get("/user/:userId", getCollegeAdminByUserId);
router.put("/:id", updateCollegeAdmin);
router.delete("/:id", deleteCollegeAdmin);

export default router;
