import mongoose, { Schema } from "mongoose";

const appointmentSchema = new Schema(
    {
        student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
        counselor: { type: Schema.Types.ObjectId, ref: "Counselor", required: true },
        college: { type: Schema.Types.ObjectId, ref: "College", required: true },

        // Store date at midnight (date-only semantics)
        date: { type: Date, required: true },

        status: {
            type: String,
            enum: ["Pending", "Approved", "Cancelled", "Completed"],
            default: "Pending"
        },

        scheduledBy: { type: Schema.Types.ObjectId, ref: "User" },
        notes: { type: String, trim: true }
    },
    { timestamps: true }
);

appointmentSchema.index({ counselor: 1, date: 1 });
appointmentSchema.index({ student: 1, date: 1 });
appointmentSchema.index({ status: 1, date: -1 });


export const Appointment = mongoose.model("Appointment", appointmentSchema);


