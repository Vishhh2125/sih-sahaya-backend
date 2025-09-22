import mongoose, { Schema } from "mongoose";

const peerSchema = new Schema(
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
        students: [{
            type: Schema.Types.ObjectId,
            ref: "Student"
        }]
    },
    { timestamps: true }
);

export const Peer = mongoose.model("Peer", peerSchema);


