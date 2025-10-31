"use client"

import React from "react";

type HeaderState = {
    title: string;
    desc?: string;
};

type HeaderContextValue = HeaderState & {
    setHeader: (next: Partial<HeaderState>) => void;
    resetHeader: () => void;
};

const DEFAULT_HEADER: HeaderState = {
    title: "Dashboard",
    desc: "Welcome to your dashboard",
};

export const HeaderContext = React.createContext<HeaderContextValue | undefined>(undefined);

export function HeaderProvider({ children, initial }: { children: React.ReactNode; initial?: Partial<HeaderState> }) {
    const [state, setState] = React.useState<HeaderState>({
        ...DEFAULT_HEADER,
        ...initial,
    });

    const setHeader = React.useCallback((next: Partial<HeaderState>) => {
        setState((prev) => ({ ...prev, ...next }));
    }, []);

    const resetHeader = React.useCallback(() => {
        setState(DEFAULT_HEADER);
    }, []);

    const value = React.useMemo<HeaderContextValue>(
        () => ({ ...state, setHeader, resetHeader }),
        [state, setHeader, resetHeader]
    );

    return <HeaderContext.Provider value={value}>{children}</HeaderContext.Provider>
}
