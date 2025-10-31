import ApiClient from "../client";

export async function login(email: string, password: string): Promise<{ success: boolean }> {
    return ApiClient.post<{ success: boolean }>("/login", { email, password });
}

export async function logout() {
    return ApiClient.post<{ success: boolean }>("/logout");
}

export async function me() {
    return ApiClient.get<{ ok: boolean; data: { userId: string; email: string; role?: string } | null }>("/me");
}

export async function sendResetPasswordLink(data: { email: string }) {
    return ApiClient.post("/auth/forgot-password", data);
}

export async function resetPassword(data: { email: string; token: string; password: string }) {
    return ApiClient.post("/auth/reset-password", data);
}

export async function validateResetLink(email: string, token: string) {
    return ApiClient.get(`/auth/validate-reset-link?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`);
}