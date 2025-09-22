import mongoose, { Schema } from "mongoose";

const counselorSchema = new Schema(
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
		qualification: {
			type: String,
			trim: true
		},
		specialization: {
			type: [String],
			default: []
		},
		college: {
			type: Schema.Types.ObjectId,
			ref: "College",
			required: true
		},
		contactEmail: String,
		contactPhone: String,
		status: {
			type: String,
			enum: ["Active", "Inactive"],
			default: "Active"
		}
	},
	{ timestamps: true }
);

counselorSchema.index({ user: 1 }, { unique: true });

export const Counselor = mongoose.model("Counselor", counselorSchema);


