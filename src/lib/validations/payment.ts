import { z } from "zod";

export const CreateCheckoutSchema = z.object({
    transactionId: z.string().min(1, "transactionId is required"),
    amount: z.number().int().positive("amount must be > 0"),
    description: z.string().optional(),
    redirectUrl: z.string().optional(),
    meta: z.any().optional(),
});

export type CreateCheckoutSchemaInput = z.infer<typeof CreateCheckoutSchema>;