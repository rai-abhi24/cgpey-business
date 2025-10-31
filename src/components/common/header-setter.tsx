"use client"

import React from "react";
import { useHeader } from "@/hooks/use-header";

export default function HeaderSetter({ title, desc }: { title: string; desc?: string }) {
    const { setHeader } = useHeader();
    React.useEffect(() => {
        setHeader({ title, desc });
    }, [title, desc, setHeader]);
    return null;
}


