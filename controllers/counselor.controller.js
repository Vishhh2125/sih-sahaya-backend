import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Counselor } from "../models/counselor.model.js";
import { User } from "../models/user.model.js";
import { College } from "../models/college.model.js";

// Get all counselors
export const getAllCounselors = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, college } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (college) filter.college = college;
    
    const counselors = await Counselor.find(filter)
        .populate('user', 'email userType')
        .populate('college', 'name')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });
    
    const total = await Counselor.countDocuments(filter);
    
    return res.status(200).json(
        new ApiResponse(200, {
            counselors,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        }, "Counselors fetched successfully")
    );
});

// Get counselors by college ID
export const getCounselorsByCollege = asyncHandler(async (req, res) => {
    const { collegeId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    
    let filter = { college: collegeId };
    if (status) filter.status = status;
    
    const counselors = await Counselor.find(filter)
        .populate('user', 'email userType')
        .populate('college', 'name')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });
    
    const total = await Counselor.countDocuments(filter);
    
    return res.status(200).json(
        new ApiResponse(200, {
            counselors,
            total,
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit))
        }, "College counselors fetched successfully")
    );
});

// Get counselor by ID
export const getCounselorById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const counselor = await Counselor.findById(id)
        .populate('user', 'email userType')
        .populate('college', 'name');
    
    if (!counselor) {
        throw new ApiError(404, "Counselor not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, counselor, "Counselor fetched successfully")
    );
});

// Create new counselor
export const createCounselor = asyncHandler(async (req, res) => {
    const { user, name, qualification, specialization, college, contactEmail, contactPhone } = req.body;
    
    // Check if user exists
    const existingUser = await User.findById(user);
    if (!existingUser) {
        throw new ApiError(404, "User not found");
    }
    
    // Check if college exists
    const existingCollege = await College.findById(college);
    if (!existingCollege) {
        throw new ApiError(404, "College not found");
    }
    
    // Check if counselor already exists for this user
    const existingCounselor = await Counselor.findOne({ user });
    if (existingCounselor) {
        throw new ApiError(400, "Counselor profile already exists for this user");
    }
    
    const counselor = await Counselor.create({
        user,
        name,
        qualification,
        specialization: specialization || [],
        college,
        contactEmail,
        contactPhone,
        status: "Active"
    });
    
    const populatedCounselor = await Counselor.findById(counselor._id)
        .populate('user', 'email userType')
        .populate('college', 'name');
    
    return res.status(201).json(
        new ApiResponse(201, populatedCounselor, "Counselor created successfully")
    );
});

// Update counselor
export const updateCounselor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updates.user;
    delete updates.college;
    
    const counselor = await Counselor.findByIdAndUpdate(id, updates, { new: true })
        .populate('user', 'email userType')
        .populate('college', 'name');
    
    if (!counselor) {
        throw new ApiError(404, "Counselor not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, counselor, "Counselor updated successfully")
    );
});

// Update counselor status
export const updateCounselorStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !["Active", "Inactive"].includes(status)) {
        throw new ApiError(400, "Invalid status. Must be 'Active' or 'Inactive'");
    }
    
    const counselor = await Counselor.findByIdAndUpdate(
        id, 
        { status }, 
        { new: true }
    ).populate('user', 'email userType')
     .populate('college', 'name');
    
    if (!counselor) {
        throw new ApiError(404, "Counselor not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, counselor, "Counselor status updated successfully")
    );
});

// Delete counselor
export const deleteCounselor = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const counselor = await Counselor.findByIdAndDelete(id);
    if (!counselor) {
        throw new ApiError(404, "Counselor not found");
    }
    
    return res.status(200).json(
        new ApiResponse(200, {}, "Counselor deleted successfully")
    );
});
