import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Appointment } from "../models/appointment.model.js";
import { Student } from "../models/student.model.js";
import { Counselor } from "../models/counselor.model.js";

// Helper to normalize a date string to midnight UTC
const toDateOnly = (value) => {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        return null;
    }
    // normalize to midnight UTC for date-only semantics
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

export const createAppointment = asyncHandler(async (req, res) => {
    const { student, counselor, college, date, notes } = req.body;

    if (!student || !counselor || !college || !date) {
        throw new ApiError(400, "student, counselor, college and date are required");
    }

    const dateOnly = toDateOnly(date);
    if (!dateOnly) {
        throw new ApiError(400, "Invalid date");
    }

    // Ensure referenced docs exist
    const [studentDoc, counselorDoc] = await Promise.all([
        Student.findById(student),
        Counselor.findById(counselor).populate("user", "email").populate("college", "_id")
    ]);
    if (!studentDoc) {
        throw new ApiError(404, "Student not found");
    }
    if (!counselorDoc) {
        throw new ApiError(404, "Counselor not found");
    }

    // Same-college enforcement based on counselor.college and provided college
    if (!counselorDoc.college || String(counselorDoc.college._id) !== String(college)) {
        throw new ApiError(400, "Counselor does not belong to the provided college");
    }

    // If you want to block multiple appointments on the same date per counselor, uncomment below
    // const sameDay = await Appointment.findOne({ counselor, date: dateOnly, status: { $in: ["Pending", "Approved"] } }).lean();
    // if (sameDay) { throw new ApiError(409, "Counselor already has an appointment on this date"); }

    const scheduledBy = req.user?._id;

    const appointment = await Appointment.create({
        student,
        counselor,
        college,
        date: dateOnly,
        status: "Pending",
        scheduledBy,
        notes
    });

    return res.status(201).json(new ApiResponse(201, appointment, "Appointment created"));
});

export const listAppointments = asyncHandler(async (req, res) => {
    const { student, counselor, college, date, status, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (student) filter.student = student;
    if (counselor) filter.counselor = counselor;
    if (college) filter.college = college;
    if (date) {
        const d = toDateOnly(date);
        if (!d) throw new ApiError(400, "Invalid date");
        filter.date = d;
    }
    if (status) filter.status = status;

    const items = await Appointment.find(filter)
        .populate({ path: "student", select: "name user" })
        .populate({ path: "counselor", select: "name college user" })
        .populate({ path: "college", select: "name" })
        .sort({ date: 1 })
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

    const total = await Appointment.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, { items, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }, "Appointments fetched")
    );
});

export const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, notes } = req.body;

    const allowed = ["Pending", "Approved", "Cancelled", "Completed"];
    if (!allowed.includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const update = { status };
    if (typeof notes === "string") {
        update.notes = notes;
    }

    const doc = await Appointment.findByIdAndUpdate(id, update, { new: true });
    if (!doc) {
        throw new ApiError(404, "Appointment not found");
    }

    return res.status(200).json(new ApiResponse(200, doc, "Appointment status updated"));
});


