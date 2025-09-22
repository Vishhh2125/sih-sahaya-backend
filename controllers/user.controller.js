
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Student } from "../models/student.model.js";
import { Counselor } from "../models/counselor.model.js";
import { CollegeAdmin } from "../models/collegeAdmin.model.js";
import { College } from "../models/college.model.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {  email,  password ,userType} = req.body;

    if (
        [ email, password, userType].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existedUser = await User.findOne({
        $or: [ { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email  already exists");
    }

    // No file upload logic here

    const user = await User.create({
       
        email,
        password,
        userType
       
    });

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );
})


const loginUser = asyncHandler(async (req, res) =>{
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    console.log("Login request body:", req.body);
    

    const {email,  password} = req.body
    console.log(email);

    if (!email) {
        throw new ApiError(400, "email is required")
    }
    if (!password) {
        throw new ApiError(400, "password is required")
    }
    
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
        
    // }

    const user = await User.findOne({ email })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

   const isPasswordValid = await user.isPasswordCorrect(password)

   if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials")
    }

   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    // Resolve full profile based on userType for client convenience
    let profile = null
    try {
        if (user.userType === "student") {
            const s = await Student.findOne({ user: user._id })
                .select("_id name studentId user")
                .lean()
            profile = s ? { profileType: "student", profile: s } : null
        } else if (user.userType === "concellor") {
            const c = await Counselor.findOne({ user: user._id })
                .select("_id name qualification specialization college contactEmail contactPhone user")
                .lean()
            profile = c ? { profileType: "concellor", profile: c } : null
        } else if (user.userType === "collage_admin") {
            const ca = await CollegeAdmin.findOne({ user: user._id })
                .select("_id name designation user")
                .lean()
            const col = await College.findOne({ user: user._id })
                .select("_id name type domain code status")
                .lean()
            profile = { profileType: "collage_admin", profile: ca || null, college: col || null }
        } else if (user.userType === "peer") {
            const { Peer } = await import("../models/peer.model.js")
            const p = await Peer.findOne({ user: user._id })
                .select("_id name students user")
                .lean()
            profile = { profileType: "peer", profile: p || null }
        }
    } catch (_) {
        // ignore profile resolution errors; keep login functional
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
                user: loggedInUser,
                accessToken,
                profile
            },
            "User logged In Successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken,
                    // refreshToken stays in cookie only
                    },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword} = req.body

    

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req, res) => {
    const {fullName, email} = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    //TODO: delete old image - assignment

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    //TODO: delete old image - assignment


    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


const getUserChannelProfile = asyncHandler(async(req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

// Create User
const createUser = asyncHandler(async (req, res) => {
    const { email, password, userType } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "Email and password are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({
        email,
        password,
        userType: userType || "student"
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User created successfully")
    );
});

// Get All Users
const getAllUsers = asyncHandler(async (req, res) => {
    const { userType, page = 1, limit = 10 } = req.query;
    
    const query = userType ? { userType } : {};
    
    const users = await User.find(query)
        .select("-password -refreshToken")
        .limit(limit * 1)
        .skip((page - 1) * limit);
    
    const total = await User.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalUsers: total
        }, "Users fetched successfully")
    );
});

// Get User by ID
const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id).select("-password -refreshToken");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, "User fetched successfully")
    );
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email, userType, isActive } = req.body;

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    if (email) {
        const emailExists = await User.findOne({ email, _id: { $ne: id } });
        if (emailExists) {
            throw new ApiError(409, "Email already in use");
        }
        user.email = email;
    }

    if (userType) user.userType = userType;
    if (typeof isActive === "boolean") user.isActive = isActive;

    await user.save();

    const updatedUser = await User.findById(id).select("-password -refreshToken");
    return res.status(200).json(
        new ApiResponse(200, updatedUser, "User updated successfully")
    );
});

// Delete User
const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(200, {}, "User deleted successfully")
    );
});

// Block/Unblock User
const toggleUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
        throw new ApiError(400, "isActive must be a boolean value");
    }

    const user = await User.findByIdAndUpdate(
        id,
        { isActive },
        { new: true }
    ).select("-password -refreshToken");

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    return res.status(200).json(
        new ApiResponse(200, user, `User ${isActive ? 'unblocked' : 'blocked'} successfully`)
    );
});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    createUser,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus
}