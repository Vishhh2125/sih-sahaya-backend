import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { CollegeRegistration } from "../models/collegeRegistration.model.js";
import { College } from "../models/college.model.js";
import { CollegeAdmin } from "../models/collegeAdmin.model.js";
import { Counselor } from "../models/counselor.model.js";
import { Student } from "../models/student.model.js";

// Unified registration endpoint branching by userType
// Expected body always includes: email, password, userType
// Additional fields depend on userType
export const registerByType = asyncHandler(async (req, res) => {

    console.log(req.body);
    const { email, password } = req.body;
    let { userType } = req.body;
    // Normalize userType casing/aliases
    const raw = String(userType || "").toLowerCase();
    if (raw === "college" || raw === "collage_admin" || raw === "collegeadmin") userType = "collage_admin";
    else if (raw === "counselor" || raw === "concellor") userType = "concellor";
    else if (raw === "student") userType = "student";
    else if (raw === "admin") userType = "admin";

	if (!email || !password || !userType) {
		throw new ApiError(400, "email, password and userType are required");
	}

	const existing = await User.findOne({ email });
	if (existing) {
		throw new ApiError(409, "User with email already exists");
	}

	// Create the base user first
	const user = await User.create({ email, password, userType });

	let data = null;
    if (userType === "collage_admin") {
		const {
			collegeName,
			collegeType,
			domain,
			nameOfApplicant,
			designation,
			verifiedCollegeDocument,
			proofOfDesignation
		} = req.body;

		if (!collegeName || !collegeType || !domain || !nameOfApplicant || !designation || !verifiedCollegeDocument || !proofOfDesignation) {
			await user.deleteOne();
			throw new ApiError(400, "Missing required college registration fields");
		}

		data = await CollegeRegistration.create({
			collegeName,
			collegeType,
			domain,
			status: "Pending",
			nameOfApplicant,
			designation,
			verifiedCollegeDocument,
			proofOfDesignation,
			email,
			password,
			userType: "College"
		});
    } else if (userType === "collage_admin") {
		// If you want to auto-create a College document when admin registers
		const { name, type, domain, code, address, contactEmail, contactPhone, website, logo, establishedYear, documents } = req.body;
		if (name && type && domain) {
			data = await College.create({
				user: user._id,
				name,
				type,
				domain,
				code,
				address,
				contactEmail,
				contactPhone,
				website,
				logo,
				establishedYear,
				documents
			});
		}
    } else if (userType === "concellor") {
        const { name, qualification, specialization, college, contactEmail, contactPhone } = req.body;
		if (!name || !college) {
			await user.deleteOne();
			throw new ApiError(400, "Missing required counselor fields");
		}
		data = await Counselor.create({
			user: user._id,
			name,
			qualification,
			specialization,
			college,
			contactEmail,
            contactPhone
		});
	} else if (userType === "student" || userType === "Student") {
		const { name, studentId, peer } = req.body;
		if (!name || !studentId) {
			await user.deleteOne();
			throw new ApiError(400, "Missing required student fields");
		}
		data = await Student.create({ user: user._id, name, studentId, peer: peer || null });
	} else if (userType === "admin" || userType === "Admin") {
		// No extra profile; user record is enough
		data = null;
	} else if (userType === "peer" || userType === "Peer") {
		// Placeholder: if you later add a Peer model
		data = null;
	} else {
		await user.deleteOne();
		throw new ApiError(400, "Unsupported userType");
	}

	return res.status(201).json(
		new ApiResponse(201, { userId: user._id, profile: data }, "Registered successfully")
	);
});

// Create a CollegeRegistration (no User created here)
export const createCollegeRegistration = asyncHandler(async (req, res) => {
    const {
        collegeName,
        collegeType,
        domain,
        nameOfApplicant,
        designation,
        verifiedCollegeDocument,
        proofOfDesignation,
        email,
        password
    } = req.body;

    if (!collegeName || !collegeType || !domain || !nameOfApplicant || !designation || !verifiedCollegeDocument || !proofOfDesignation || !email || !password) {
        throw new ApiError(400, "All fields and documents are required");
    }

    const duplicate = await CollegeRegistration.findOne({ email });
    if (duplicate) {
        throw new ApiError(409, "A registration with this email already exists");
    }

    const reg = await CollegeRegistration.create({
        collegeName,
        collegeType,
        domain,
        status: "Pending",
        nameOfApplicant,
        designation,
        verifiedCollegeDocument,
        proofOfDesignation,
        email,
        // Store hashed password so later creating User doesn't double-hash
        password
    });

    return res.status(201).json(new ApiResponse(201, { registrationId: reg._id, status: reg.status }, "College registration submitted"));
});

// Approve a CollegeRegistration and auto-provision College Admin + College
export const approveCollegeRegistration = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const registration = await CollegeRegistration.findById(id);
    if (!registration) {
        throw new ApiError(404, "College registration not found");
    }

    if (registration.status === "Approved") {
        return res.status(200).json(
            new ApiResponse(200, { message: "Already approved" }, "No action needed")
        );
    }

    // Mark approved
    registration.status = "Approved";
    await registration.save();

    // Check if user already exists
    let user = await User.findOne({ email: registration.email });
    if (!user) {
        // Create admin user
        user = await User.create({
            email: registration.email,
            password: registration.password,
            userType: "collage_admin"
        });
    }

    // Create College record
    const college = await College.create({
        user: user._id,
        name: registration.collegeName,
        type: registration.collegeType,
        domain: registration.domain,
        contactEmail: registration.email,
        documents: [registration.verifiedCollegeDocument], // Copy the verified college document
        status: "Active"
    });

    // Create CollegeAdmin profile
    const collegeAdmin = await CollegeAdmin.create({
        user: user._id,
        name: registration.nameOfApplicant,
        designation: registration.designation,
        proofDocument: registration.proofOfDesignation
    });

    return res.status(200).json(
        new ApiResponse(200, { 
            userId: user._id, 
            collegeId: college._id, 
            collegeAdminId: collegeAdmin._id, 
            registrationId: registration._id 
        }, "College approved and admin provisioned successfully")
    );
});

export const rejectCollegeRegistration = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const registration = await CollegeRegistration.findById(id);
    if (!registration) {
        throw new ApiError(404, "College registration not found");
    }
    registration.status = "Rejected";
    await registration.save();
    return res.status(200).json(
        new ApiResponse(200, { registrationId: registration._id, status: registration.status }, "College registration rejected")
    );
});

export const setPendingCollegeRegistration = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const registration = await CollegeRegistration.findById(id);
    if (!registration) {
        throw new ApiError(404, "College registration not found");
    }
    registration.status = "Pending";
    await registration.save();
    return res.status(200).json(
        new ApiResponse(200, { registrationId: registration._id, status: registration.status }, "College registration set to pending")
    );
});

export const listCollegeRegistrations = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;
    const filter = status ? { status } : {};
    const docs = await CollegeRegistration.find(filter)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 });
    const total = await CollegeRegistration.countDocuments(filter);
    return res.status(200).json(
        new ApiResponse(200, { items: docs, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) }, "College registrations fetched")
    );
});


