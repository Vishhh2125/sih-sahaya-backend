import { Router } from "express";
import { registerByType, approveCollegeRegistration, rejectCollegeRegistration, setPendingCollegeRegistration, listCollegeRegistrations, createCollegeRegistration, downloadVerifiedCollegeDocument, downloadProofOfDesignation } from "../controllers/registration.controller.js";
import { uploadRegistrationFiles, normalizeRegistrationFiles } from "../middleware/registrationUpload.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/register-any", uploadRegistrationFiles, normalizeRegistrationFiles, registerByType);
router.post("/college-registrations", uploadRegistrationFiles, normalizeRegistrationFiles, createCollegeRegistration);
router.post("/college-registrations/:id/approve", verifyJWT, approveCollegeRegistration);
router.post("/college-registrations/:id/reject", verifyJWT, rejectCollegeRegistration);
router.post("/college-registrations/:id/pending", verifyJWT, setPendingCollegeRegistration);


//getting all 
router.get("/college-registrations", verifyJWT, listCollegeRegistrations);

// File downloads (admin only)
router.get("/college-registrations/:id/files/verified", verifyJWT, downloadVerifiedCollegeDocument);
router.get("/college-registrations/:id/files/proof", verifyJWT, downloadProofOfDesignation);

export default router;


