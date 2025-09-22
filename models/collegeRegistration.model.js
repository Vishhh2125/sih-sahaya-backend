import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

const documentSubSchema = new Schema(
	{
		filename: { type: String, required: true },
		contentType: { type: String, required: true },
		data: { type: Buffer, required: true }
	},
	{ _id: false }
);

const collegeRegistrationSchema = new Schema(
	{
		collegeName: {
			type: String,
			required: true,
			trim: true
		},
		collegeType: {
			type: String,
			enum: ["Private", "Government", "Autonomous", "Other"],
			required: true
		},
		verifiedCollegeDocument: {
			type: documentSubSchema,
			required: true
		},
		domain: {
			type: String,
			required: true,
			trim: true
		},
		status: {
			type: String,
			enum: ["Pending", "Approved", "Rejected"],
			default: "Pending"
		},
		nameOfApplicant: {
			type: String,
			required: true,
			trim: true
		},
		designation: {
			type: String,
			required: true
		},
		proofOfDesignation: {
			type: documentSubSchema,
			required: true
		},
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true
		},
		password: {
			type: String,
			required: true
		}
	},
	{ timestamps: true }
);

collegeRegistrationSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 10);
	next();
});

export const CollegeRegistration = mongoose.model(
	"CollegeRegistration",
	collegeRegistrationSchema
);


