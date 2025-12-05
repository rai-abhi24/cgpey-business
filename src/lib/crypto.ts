import crypto from "crypto";

export function generateApiKey(env: "uat" | "prod"): string {
    return `pk_${env === "uat" ? "uat" : "live"}_` + crypto.randomBytes(16).toString("hex");
}

export function generateSecretKey(env: "uat" | "prod"): string {
    return `sk_${env === "uat" ? "uat" : "live"}_` + crypto.randomBytes(32).toString("hex");
}