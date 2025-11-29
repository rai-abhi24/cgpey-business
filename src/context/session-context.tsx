"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState
} from "react";

import type { MerchantMode } from "@/models/Merchant";
import type { ISession } from "@/types/session";
import { UserRole } from "@/models/User";

type SessionContextValue = {
    session: ISession | null;
    role: UserRole;

    // MERCHANT ONLY
    currentMode?: MerchantMode;
    allowedModes?: MerchantMode[];
    setMode?: (mode: MerchantMode) => Promise<void>;
    account?: any;

    // COMMON
    refresh: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({
    initialSession,
    children
}: {
    initialSession: ISession;
    children: React.ReactNode;
}) {
    const [session, setSession] = useState<ISession>(initialSession);

    const role = session.role;
    const isMerchant = role === "MERCHANT";

    const currentMode = isMerchant ? session.currentMode : undefined;
    const allowedModes = isMerchant ? session.allowedModes || [] : undefined;

    const refresh = useCallback(async () => {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        if (!res.ok) return;

        const data = await res.json();

        if (data?.session) {
            setSession(data.session);
        } else if (data?.merchant) {
            setSession(data.merchant);
        }
    }, []);

    const setMode = useCallback(
        async (nextMode: MerchantMode) => {
            if (!isMerchant) return;
            if (!allowedModes?.includes(nextMode)) return;

            const prev = session.currentMode;

            setSession(prevSession => ({
                ...prevSession!,
                currentMode: nextMode
            }));

            try {
                const res = await fetch("/api/merchant/profile/mode", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ mode: nextMode })
                });

                if (!res.ok) throw new Error("Mode update failed");

                await refresh();
            } catch (err) {
                console.error("Failed to update mode", err);

                setSession(prevSession => ({
                    ...prevSession!,
                    currentMode: prev
                }));
            }
        },
        [isMerchant, allowedModes, session, refresh]
    );

    const value = useMemo<SessionContextValue>(() => {
        return {
            session,
            role,
            currentMode,
            allowedModes,
            setMode: isMerchant ? setMode : undefined,
            refresh,
            account: isMerchant ? session.account : undefined
        };
    }, [session, role, currentMode, allowedModes, setMode, refresh]);

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
}

export function useSession() {
    const ctx = useContext(SessionContext);
    if (!ctx) throw new Error("useSession must be used within SessionProvider");
    return ctx;
}

export function useMerchantMode() {
    const ctx = useSession();

    return {
        currentMode: ctx.currentMode,
        allowedModes: ctx.allowedModes,
        setMode: ctx.setMode
    };
}