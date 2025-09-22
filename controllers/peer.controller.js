import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { Peer } from "../models/peer.model.js";
import { Student } from "../models/student.model.js";

// Create a Peer user and profile, and assign students to this peer
export const createPeer = asyncHandler(async (req, res) => {
    const { name, email, password, studentIds } = req.body;

    if (!name || !email || !password) {
        throw new ApiError(400, "name, email, password are required");
    }

    const existing = await User.findOne({ email });
    if (existing) {
        throw new ApiError(409, "User with email already exists");
    }

    const user = await User.create({ email, password, userType: "peer" });

    const peer = await Peer.create({ user: user._id, name, students: [] });

    if (Array.isArray(studentIds) && studentIds.length) {
        // Validate student ids exist
        const students = await Student.find({ _id: { $in: studentIds } }).select("_id");
        const foundIds = students.map(s => s._id.toString());
        // assign peer on students
        await Student.updateMany({ _id: { $in: foundIds } }, { $set: { peer: peer._id } });
        peer.students = students.map(s => s._id);
        await peer.save();
    }

    return res.status(201).json(
        new ApiResponse(201, { userId: user._id, peerId: peer._id }, "Peer created and students assigned")
    );
});

// Update peer's assigned students (replace assignment with provided array)
export const assignStudents = asyncHandler(async (req, res) => {
    const { id } = req.params; // peer id
    const { studentIds } = req.body;

    const peer = await Peer.findById(id);
    if (!peer) {
        throw new ApiError(404, "Peer not found");
    }

    // Remove peer from previously assigned students not in the new list
    await Student.updateMany(
        { _id: { $in: peer.students } },
        { $set: { peer: null } }
    );

    // Assign to new list
    const students = Array.isArray(studentIds) && studentIds.length
        ? await Student.find({ _id: { $in: studentIds } }).select("_id")
        : [];

    if (students.length) {
        await Student.updateMany({ _id: { $in: students.map(s => s._id) } }, { $set: { peer: peer._id } });
    }

    peer.students = students.map(s => s._id);
    await peer.save();

    return res.status(200).json(new ApiResponse(200, { peerId: peer._id, students: peer.students }, "Peer assignments updated"));
});


