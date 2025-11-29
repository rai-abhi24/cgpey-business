export type UserRole = "ADMIN" | "MERCHANT";

export interface MerchantAccountSummary {
    totalTransactions: number;
    totalVolume: number;
    balance: number;
}

/**
 * UNIVERSAL SESSION SHAPE
 * ADMIN + MERCHANT BOTH
 */
export interface ISession {
    // Common fields
    role: UserRole;
    userId: string;
    phone?: string;
    email?: string;
    lastLoginAt?: string | null;

    // Session-level identifiers (optional)
    sessionId?: string;

    // MERCHANT-ONLY fields
    merchantId?: string | null;
    merchantMongoId?: string | null;
    currentMode?: "UAT" | "PROD";
    allowedModes?: ("UAT" | "PROD")[];
    account?: MerchantAccountSummary;

    // Optional future admin UI fields
    displayName?: string;
    canSwitchMode?: boolean;
}