import { Router } from "express";
import { 
    getAllColleges, 
    getCollegeById, 
    updateCollege, 
    deleteCollege 
} from "../controllers/college.controller.js";

const router = Router();

router.get("/", getAllColleges);
router.get("/:id", getCollegeById);
router.put("/:id", updateCollege);
router.delete("/:id", deleteCollege);

export default router;
