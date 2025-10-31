"use client"
import { HeaderContext } from "@/context/header-context";
import React from "react";

export function useHeader() {
    const ctx = React.useContext(HeaderContext);
    if (!ctx) {
        throw new Error("useHeader must be used within a HeaderProvider");
    }
    return ctx;
}


