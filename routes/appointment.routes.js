import { Router } from "express";
import { createAppointment, listAppointments, updateAppointmentStatus } from "../controllers/appointment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Admin schedules appointments; protect with auth
router.post("/", verifyJWT, createAppointment);

// List with filters
router.get("/", verifyJWT, listAppointments);

// Update status
router.patch("/:id/status", verifyJWT, updateAppointmentStatus);

export default router;


