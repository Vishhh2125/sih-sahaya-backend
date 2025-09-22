import mongoose, { Schema } from "mongoose";

const documentSubSchema = new Schema(
	{
		filename: String,
		contentType: String,
		data: Buffer
	},
	{ _id: false }
);

const collegeAdminSchema = new Schema(
	{
		user: {
			type: Schema.Types.ObjectId,
			ref: "User",
			required: true,
			unique: true
		},
		name: {
			type: String,
			required: true,
			trim: true
		},
		designation: {
			type: String,
			required: true,
			trim: true
		},
		proofDocument: documentSubSchema,
		status: {
			type: String,
			enum: ["Active", "Inactive"],
			default: "Active"
		}
	},
	{ timestamps: true }
);

collegeAdminSchema.index({ user: 1 }, { unique: true });

export const CollegeAdmin = mongoose.model("CollegeAdmin", collegeAdminSchema);
