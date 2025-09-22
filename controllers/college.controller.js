import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { College } from "../models/college.model.js";

// Get all colleges
export const getAllColleges = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status } = req.query;
    const filter = status ? { status } : {};
    
    const colleges = await College.find(filter)
        .populate('user', 'email userType')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });
    
    const total = await College.countDocuments(filter);
    
    return res.status(200).json(
        new ApiResponse(200, {
            colleges,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        }, "Colleges fetched successfully")
    );
});

// Get college by ID
export const getCollegeById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const college = await College.findById(id).populate('user', 'email userType');
    if (!college) {
        throw new ApiError(404, "College not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, college, "College fetched successfully")
    );
});

// Update college
export const updateCollege = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    const college = await College.findByIdAndUpdate(id, updates, { new: true })
        .populate('user', 'email userType');
    
    if (!college) {
        throw new ApiError(404, "College not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, college, "College updated successfully")
    );
});

// Delete college
export const deleteCollege = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const college = await College.findByIdAndDelete(id);
    if (!college) {
        throw new ApiError(404, "College not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "College deleted successfully")
    );
});

// Download a specific college document by index
export const downloadCollegeDocument = asyncHandler(async (req, res) => {
    const { id, index } = req.params;
    const idx = Number(index);
    if (Number.isNaN(idx) || idx < 0) {
        throw new ApiError(400, "Invalid document index");
    }
    const college = await College.findById(id).lean();
    if (!college) {
        throw new ApiError(404, "College not found");
    }
    const doc = Array.isArray(college.documents) ? college.documents[idx] : undefined;
    if (!doc || !doc.data) {
        throw new ApiError(404, "Document not found");
    }
    const dispositionType = String(req.query.inline) === "true" ? "inline" : "attachment";
    res.setHeader("Content-Type", doc.contentType || "application/octet-stream");
    res.setHeader(
        "Content-Disposition",
        `${dispositionType}; filename="${encodeURIComponent(doc.filename || "document")}` + "\""
    );
    return res.end(Buffer.from(doc.data.buffer || doc.data));
});