import crypto from "crypto";

export function generateApiKey(): string {
    return "api_" + crypto.randomBytes(16).toString("hex");
}

export function generateSecretKey(): string {
    return "sec_" + crypto.randomBytes(32).toString("hex");
}