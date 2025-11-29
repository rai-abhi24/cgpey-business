// src/models/report.model.ts
import mongoose, { Document, Schema, Types } from "mongoose";

export enum ReportType {
    TRANSACTIONS = "TRANSACTIONS",
    SETTLEMENTS = "SETTLEMENTS",
}

export enum ReportStatus {
    QUEUED = "QUEUED",
    PROCESSING = "PROCESSING",
    READY = "READY",
    FAILED = "FAILED",
}

export interface IReport extends Document {
    _id: Types.ObjectId;
    merchantId: Types.ObjectId;
    reportId: string;
    type: ReportType;
    rangeStart: Date;
    rangeEnd: Date;
    status: ReportStatus;
    downloadUrl?: string;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
    {
        merchantId: {
            type: Schema.Types.ObjectId,
            ref: "Merchant",
            required: true,
            index: true,
        },

        reportId: {
            type: String,
            required: true,
            unique: true,
        },

        type: {
            type: String,
            enum: Object.values(ReportType),
            required: true,
        },

        rangeStart: { type: Date, required: true },
        rangeEnd: { type: Date, required: true },

        status: {
            type: String,
            enum: Object.values(ReportStatus),
            default: ReportStatus.QUEUED,
            index: true,
        },

        downloadUrl: { type: String },
        errorMessage: { type: String },
    },
    { timestamps: true }
);

export const Report =
    mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);