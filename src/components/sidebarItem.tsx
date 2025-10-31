"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export default function SidebarItem({
    icon: Icon,
    label,
    href,
    collapsed,
}: {
    icon: LucideIcon;
    label: string;
    href: string;
    collapsed: boolean;
}) {
    return (
        <Link
            href={href}
            className={cn(
                "flex items-center p-3 hover:bg-gray-100 rounded-md transition-colors mx-2",
                collapsed && "justify-center"
            )}
        >
            <Icon className="h-5 w-5" />
            {!collapsed && <span className="ml-3">{label}</span>}
        </Link>
    );
}