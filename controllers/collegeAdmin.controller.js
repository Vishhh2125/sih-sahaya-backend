import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { CollegeAdmin } from "../models/collegeAdmin.model.js";

// Get all college admins
export const getAllCollegeAdmins = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const filter = status ? { status } : {};
    
    const collegeAdmins = await CollegeAdmin.find(filter)
        .populate('user', 'email userType')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });
    
    const total = await CollegeAdmin.countDocuments(filter);
    
    return res.status(200).json(
        new ApiResponse(200, {
            collegeAdmins,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        }, "College admins fetched successfully")
    );
});

// Get college admin by ID
export const getCollegeAdminById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const collegeAdmin = await CollegeAdmin.findById(id).populate('user', 'email userType');
    if (!collegeAdmin) {
        throw new ApiError(404, "College admin not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, collegeAdmin, "College admin fetched successfully")
    );
});

// Get college admin by user ID
export const getCollegeAdminByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    const collegeAdmin = await CollegeAdmin.findOne({ user: userId }).populate('user', 'email userType');
    if (!collegeAdmin) {
        throw new ApiError(404, "College admin not found for this user");
    }
    
    return res.status(200).json(
        new ApiResponse(200, collegeAdmin, "College admin fetched successfully")
    );
});

// Update college admin
export const updateCollegeAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const collegeAdmin = await CollegeAdmin.findByIdAndUpdate(id, updates, { new: true })
        .populate('user', 'email userType');
    
    if (!collegeAdmin) {
        throw new ApiError(404, "College admin not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, collegeAdmin, "College admin updated successfully")
    );
});

// Delete college admin
export const deleteCollegeAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const collegeAdmin = await CollegeAdmin.findByIdAndDelete(id);
    if (!collegeAdmin) {
        throw new ApiError(404, "College admin not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "College admin deleted successfully")
    );
});

// Download proof document for a college admin
export const downloadCollegeAdminProof = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const docOwner = await CollegeAdmin.findById(id).lean();
    if (!docOwner) {
        throw new ApiError(404, "College admin not found");
    }
    const doc = docOwner.proofDocument;
    if (!doc || !doc.data) {
        throw new ApiError(404, "Proof document not found");
    }
    const dispositionType = String(req.query.inline) === "true" ? "inline" : "attachment";
    res.setHeader("Content-Type", doc.contentType || "application/octet-stream");
    res.setHeader(
        "Content-Disposition",
        `${dispositionType}; filename="${encodeURIComponent(doc.filename || "proof_document")}` + "\""
    );
    return res.end(Buffer.from(doc.data.buffer || doc.data));
});