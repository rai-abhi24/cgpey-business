"use client";

import { useEffect, useState } from "react";
import { Menu, X, LayoutDashboard, LogOut, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SidebarItem from "./sidebarItem";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    // Close mobile sidebar when route changes
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Close mobile sidebar when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const sidebar = document.getElementById('sidebar');
            const mobileToggle = document.getElementById('mobile-toggle');

            if (mobileOpen &&
                sidebar &&
                !sidebar.contains(event.target as Node) &&
                mobileToggle &&
                !mobileToggle.contains(event.target as Node)) {
                setMobileOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [mobileOpen]);

    // Handle escape key to close mobile sidebar
    useEffect(() => {
        const handleEscKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && mobileOpen) {
                setMobileOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscKey);
        return () => {
            document.removeEventListener('keydown', handleEscKey);
        };
    }, [mobileOpen]);

    const signOut = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }

    // Mobile toggle button (fixed position)
    const MobileToggle = () => (
        <Button id="mobile-toggle" variant="ghost" size="icon" className="fixed top-7 left-4 z-40 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
        </Button>
    );

    return (
        <>
            <MobileToggle />

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                id="sidebar"
                className={cn(
                    "fixed h-screen bg-white border-r transition-all duration-300 z-50 flex flex-col",
                    collapsed ? "w-20" : "w-64",
                    mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
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

                <div className="flex-1 space-y-1 mt-2 overflow-y-auto">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/" collapsed={collapsed} />
                    <SidebarItem icon={User} label="Merchants" href="/merchants" collapsed={collapsed} />
                    <SidebarItem icon={CreditCard} label="Transactions" href="/transactions" collapsed={collapsed} />
                    {/* <SidebarItem icon={RiMoneyRupeeCircleFill as any} label="Pay" href="/payment" collapsed={collapsed} /> */}
                </div>

                <div className="p-4 border-t">
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => signOut()}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        {!collapsed && "Logout"}
                    </Button>
                </div>
            </div>

            {/* Content margin for desktop */}
            <div className={cn(
                "hidden lg:block",
                collapsed ? "ml-20" : "ml-64"
            )} />
        </>
    );
}