import ApiClient from "../client";
import type { MerchantAccountSummary, MerchantSession } from "@/types/session";

export async function sendOTP(phoneNumber: string): Promise<{ success: boolean }> {
    return ApiClient.post<{ success: boolean }>("/auth/send-otp", { phone: phoneNumber });
}

export async function verifyOTP(phoneNumber: string, otp: string): Promise<{ success: boolean }> {
    return ApiClient.post<{ success: boolean }>("/auth/verify-otp", { phone: phoneNumber, otp });
}

export async function me() {
    return ApiClient.get<{ success: boolean; user: MerchantAccountSummary | null; merchant: MerchantSession | null }>("/me");
}

export async function logout() {
    return ApiClient.post<{ success: boolean }>("/logout");
}
