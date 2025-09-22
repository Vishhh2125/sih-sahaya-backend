import mongoose, { Schema } from "mongoose";

const documentSubSchema = new Schema(
	{
		filename: String,
		contentType: String,
		data: Buffer
	},
	{ _id: false }
);

const addressSubSchema = new Schema(
	{
		street: String,
		city: String,
		state: String,
		country: String,
		pincode: String
	},
	{ _id: false }
);

const collegeSchema = new Schema(
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
		type: {
			type: String,
			enum: ["Private", "Government", "Autonomous", "Other"],
			required: true
		},
		domain: {
			type: String,
			required: true,
			trim: true,
			unique: true
		},
		code: {
			type: String,
			unique: true,
			sparse: true
		},
		address: addressSubSchema,
		contactEmail: String,
		contactPhone: String,
		website: String,
		logo: documentSubSchema,
		establishedYear: Number,
		documents: [documentSubSchema],
		status: {
			type: String,
			enum: ["Active", "Inactive"],
			default: "Active"
		}
	},
	{ timestamps: true }
);

// Reinforce indexes explicitly (Mongoose unique is an index definition)
collegeSchema.index({ user: 1 }, { unique: true });
collegeSchema.index({ domain: 1 }, { unique: true });
collegeSchema.index({ code: 1 }, { unique: true, sparse: true });

export const College = mongoose.model("College", collegeSchema);


