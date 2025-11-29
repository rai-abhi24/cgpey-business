import { z } from "zod";

export const transactionFiltersSchema = z.object({
    search: z.string().optional(),
    status: z.string().optional(),
    paymentMode: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    minAmount: z.string().optional(),
    maxAmount: z.string().optional(),
    environment: z.string().optional(),
});

export const manualSettlementSchema = z.object({
    cycleStart: z.string().min(1),
    cycleEnd: z.string().min(1),
    amount: z.number().positive(),
    fees: z.number().nonnegative().optional(),
    settlementMode: z.string().optional(),
    notes: z.string().max(500).optional(),
});

export const reportRequestSchema = z.object({
    rangeStart: z.string().min(1),
    rangeEnd: z.string().min(1),
    type: z.enum(["TRANSACTIONS", "SETTLEMENTS"]),
});
