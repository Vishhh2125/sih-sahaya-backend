import mongoose, { Schema } from "mongoose";

const studentSchema = new Schema(
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
    studentId: {
      type: String,
      required: true,
      unique: true
    },
    peer: {
      type: Schema.Types.ObjectId,
      ref: "Peer",
      default: null
    }
  },
  { timestamps: true }
);

export const Student = mongoose.model("Student", studentSchema);