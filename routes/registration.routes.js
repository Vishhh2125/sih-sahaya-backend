import { Router } from "express";
import { registerByType, approveCollegeRegistration, rejectCollegeRegistration, setPendingCollegeRegistration, listCollegeRegistrations, createCollegeRegistration } from "../controllers/registration.controller.js";
import { uploadRegistrationFiles, normalizeRegistrationFiles } from "../middleware/registrationUpload.middleware.js";

const router = Router();

router.post("/register-any", uploadRegistrationFiles, normalizeRegistrationFiles, registerByType);
router.post("/college-registrations", uploadRegistrationFiles, normalizeRegistrationFiles, createCollegeRegistration);
router.post("/college-registrations/:id/approve", approveCollegeRegistration);
router.post("/college-registrations/:id/reject", rejectCollegeRegistration);
router.post("/college-registrations/:id/pending", setPendingCollegeRegistration);
router.get("/college-registrations", listCollegeRegistrations);

export default router;


