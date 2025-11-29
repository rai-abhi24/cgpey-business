"use client";

import { useHeader } from "@/hooks/use-header";
import { Button } from "@/components/ui/button";
import { useSession, useMerchantMode } from "@/context/session-context";
import type { MerchantMode } from "@/models/Merchant";
import { cn } from "@/lib/utils";
import { ISession } from "@/types/session";
import { UserRole } from "@/models/User";

export default function Header({ title, desc }: any) {
    const header = useHeader();
    const resolvedTitle = title ?? header.title;
    const resolvedDesc = desc ?? header.desc;

    return (
        <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between p-4 border-b bg-background">
            <div className="flex items-center gap-2">
                <div className="ml-12 lg:ml-3">
                    <p className="text-lg font-semibold">{resolvedTitle}</p>
                    <p className="text-sm text-gray-600">{resolvedDesc}</p>
                </div>
            </div>

            <div className="flex items-center gap-10">
                <ModeToggle />
                <AccountBadge />
            </div>
        </header>
    );
}

function ModeToggle() {
    const { role, session }: { role: UserRole; session: ISession | null } = useSession();
    const { currentMode, allowedModes = [], setMode } = useMerchantMode();

    if (role === "ADMIN") return null;

    const isModeSwitchAllowed = session && session.canSwitchMode !== false;

    return (
        <div className="hidden sm:flex items-center rounded-full border bg-white px-1 py-1 shadow-sm">
            {(["UAT", "PROD"] as MerchantMode[]).map((mode) => {
                const isActive = currentMode === mode;
                const isAllowed = allowedModes?.includes(mode);
                const disabled = !isAllowed || !isModeSwitchAllowed || !setMode;

                return (
                    <Button
                        key={mode}
                        size="sm"
                        variant={isActive ? "default" : "ghost"}
                        disabled={disabled}
                        className={cn(
                            "rounded-full px-4 text-xs font-semibold",
                            (disabled || !isAllowed) && "opacity-40 cursor-not-allowed"
                        )}
                        onClick={() => !disabled && setMode?.(mode as any)}
                    >
                        {mode}
                    </Button>
                );
            })}
        </div>
    );
}

function AccountBadge() {
    const { session, role }: any = useSession();

    const identifier = role === "ADMIN" ? "Admin" : session.displayName || session.email || session.phone || "User";

    return (
        <div className="hidden sm:flex flex-col items-end text-left lg:text-right">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Signed in as</p>
            <p className="text-sm font-semibold">{identifier}</p>
        </div>
    );
}
