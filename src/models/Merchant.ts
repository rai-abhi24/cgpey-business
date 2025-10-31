import mongoose from "mongoose";

const MerchantSchema = new mongoose.Schema({
    business: {
        legalName: { type: String, required: true },
    },
    personal: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
    },
    businessEntityType: { type: String, required: true },
    perTransactionLimit: { type: Number, required: true },
    status: { type: String, default: "pending" },
    apiKey: { type: String },
    secretKey: { type: String },
    createdAt: { type: Date, default: Date.now },
});

export const Merchant =
    mongoose.models.Merchant || mongoose.model("Merchant", MerchantSchema);