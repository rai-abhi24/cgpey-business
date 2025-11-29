"use client";

import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, LogOut, CreditCard, Settings, Users, BarChart2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SidebarItem from "./sidebarItem";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession } from "@/context/session-context";

export default function Sidebar() {
    const { role } = useSession(); // ⭐ ROLE HERE
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile sidebar when route changes
    useEffect(() => setMobileOpen(false), [pathname]);

    // Close when clicking outside
    useEffect(() => {
        const handler = (event: MouseEvent) => {
            const sidebar = document.getElementById("sidebar");
            const mobileToggle = document.getElementById("mobile-toggle");

            if (
                mobileOpen &&
                sidebar &&
                !sidebar.contains(event.target as Node) &&
                mobileToggle &&
                !mobileToggle.contains(event.target as Node)
            ) {
                setMobileOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [mobileOpen]);

    // ESC key handler
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.key === "Escape" && mobileOpen) {
                setMobileOpen(false);
            }
        };

        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [mobileOpen]);

    const signOut = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
        } catch (error) {
            console.warn("Logout error", error);
        } finally {
            window.location.href = "/login";
        }
    };

    // ⭐ MENU DEFINITIONS
    const merchantMenu = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: CreditCard, label: "Transactions", href: "/transactions" },
        { icon: Settings, label: "Profile", href: "/profile" },
    ];

    const adminMenu = [
        { icon: LayoutDashboard, label: "Dashboard", href: "/" },
        { icon: Users, label: "Merchants", href: "/merchants" },
        { icon: CreditCard, label: "Transactions", href: "/transactions" },
        { icon: RefreshCcw, label: "Webhooks", href: "/webhooks" },
        { icon: BarChart2, label: "Reports", href: "/reports" },
        { icon: Settings, label: "Settings", href: "/profile" },
    ];

    const menuItems = role === "ADMIN" ? adminMenu : merchantMenu;

    return (
        <>
            {/* MOBILE BUTTON */}
            <Button
                id="mobile-toggle"
                variant="ghost"
                size="icon"
                className="fixed top-7 left-4 z-40 lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
            >
                {mobileOpen ? <X /> : <Menu />}
            </Button>

            {/* MOBILE BACKDROP */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* SIDEBAR */}
            <div
                id="sidebar"
                className={cn(
                    "fixed h-screen bg-white border-r transition-all duration-300 z-50 flex flex-col",
                    collapsed ? "w-20" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                {/* LOGO + COLLAPSE */}
                <div className="flex items-center justify-between px-4 py-[22px] border-b">
                    <div className={cn(collapsed && "hidden")}>
                        <Image
                            src="/logo-with-name.svg"
                            alt="CGPEY"
                            width={120}
                            height={150}
                            priority
                        />
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="hidden lg:flex"
                        onClick={() => setCollapsed(!collapsed)}
                    >
                        <Menu />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setMobileOpen(false)}
                    >
                        <X />
                    </Button>
                </div>

                {/* ⭐ ROLE-BASED MENU */}
                <div className="flex-1 space-y-1 mt-4 overflow-y-auto">
                    {menuItems.map((item) => (
                        <SidebarItem
                            key={item.href}
                            icon={item.icon}
                            label={item.label}
                            href={item.href}
                            collapsed={collapsed}
                        />
                    ))}
                </div>

                {/* LOGOUT */}
                <div className="p-4 border-t">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={signOut}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {!collapsed && "Logout"}
                    </Button>
                </div>
            </div>

            {/* DESKTOP SPACING */}
            <div
                className={cn(
                    "hidden lg:block",
                    collapsed ? "ml-20" : "ml-64"
                )}
            />
        </>
    );
}