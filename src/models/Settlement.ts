import mongoose, { Document, Schema } from "mongoose";

export enum SettlementStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    PAID = "PAID",
    FAILED = "FAILED",
    MANUAL_PENDING = "MANUAL_PENDING",
}

export interface ISettlement extends Document {
    merchantId: string;
    cycleStart: Date;
    cycleEnd: Date;
    settlementDate?: Date;
    amount: number;
    fees: number;
    netAmount: number;
    settlementMode: string;
    referenceId?: string;
    status: SettlementStatus;
    notes?: string;
    manualTrigger?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const SettlementSchema = new Schema<ISettlement>(
    {
        merchantId: { type: String, required: true, index: true },
        cycleStart: { type: Date, required: true },
        cycleEnd: { type: Date, required: true },
        settlementDate: { type: Date },
        amount: { type: Number, required: true },
        fees: { type: Number, default: 0 },
        netAmount: { type: Number, required: true },
        settlementMode: { type: String, default: "IMPS" },
        referenceId: { type: String },
        status: {
            type: String,
            enum: Object.values(SettlementStatus),
            default: SettlementStatus.PENDING,
        },
        notes: { type: String },
        manualTrigger: { type: Boolean, default: false },
    },
    { timestamps: true }
);

SettlementSchema.index({ merchantId: 1, cycleEnd: -1 });

export const Settlement = mongoose.models.Settlement || mongoose.model<ISettlement>("Settlement", SettlementSchema);
