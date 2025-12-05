import { describe, expect, it } from "vitest";
import { aggregateTotals, fillTrend } from "@/lib/services/merchant-insights";
import { PaymentState } from "@/models/Payment";

describe("merchant insights helpers", () => {
    it("computes aggregate totals correctly", () => {
        const totals = aggregateTotals([
            { _id: PaymentState.SUCCESS, amount: 1000, count: 4 },
            { _id: PaymentState.FAILED, amount: 500, count: 2 },
        ]);

        expect(totals.totalVolume).toBe(1500);
        expect(totals.totalCount).toBe(6);
        expect(totals.successCount).toBe(4);
        expect(totals.successRate).toBeCloseTo(66.66, 1);
        expect(totals.averageTicketSize).toBe(250);
    });

    it("fills trend gaps across date ranges", () => {
        const today = new Date("2024-05-10");
        const start = new Date("2024-05-08");
        const trend = fillTrend(
            [
                { _id: "2024-05-08", amount: 100, count: 2 },
                { _id: "2024-05-10", amount: 200, count: 1 },
            ],
            start,
            today
        );

        expect(trend).toHaveLength(3);
        expect(trend[1].amount).toBe(0); // missing day backfilled
        expect(trend[2].amount).toBe(200);
    });
});
