import mongoose, { Schema } from "mongoose";

const UserSchema = new Schema(
    {
        name: { type: String },
        phone: { type: String, unique: true, required: true },
        role: { type: String, default: "user" },
        otp: { type: String },
        otpExpiresAt: { type: Date },
    },
    { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);