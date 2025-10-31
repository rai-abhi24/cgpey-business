"use client";

import { useState } from "react";
import { Menu, LayoutDashboard, LogOut, User, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import SidebarItem from "./sidebarItem";
import Image from "next/image";

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const signOut = () => {
        localStorage.removeItem("token");
        window.location.href = "/login";
    }

    return (
        <div className={cn(
            "hidden h-screen bg-white border-r transition-all duration-300 lg:flex flex-col",
            collapsed ? "w-20" : "w-64"
        )}>
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
                <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)}>
                    <Menu />
                </Button>
            </div>

            <div className="flex-1 space-y-1 mt-2">
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
    );
}