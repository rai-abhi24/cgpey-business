"use client";

import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { HeaderProvider } from "@/context/header-context";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
    const [isClient, setIsClient] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        // ensure this runs only on client
        setIsClient(true);
        const token = localStorage.getItem("token");
        if (!token) {
            redirect("/login");
        } else {
            setIsAuthenticated(true);
        }
    }, []);

    // while waiting for client-side check
    if (!isClient || isAuthenticated === null) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    return (
        <main className="flex h-screen">
            <div className="flex-shrink-0">
                <Sidebar />
            </div>

            <HeaderProvider initial={{ title: "Dashboard", desc: "Welcome to your dashboard" }}>
                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex-shrink-0">
                        <Header />
                    </div>

                    <div className="flex-1 p-6 bg-gray-50 overflow-y-auto">
                        <div className="max-h-full">
                            {children}
                        </div>
                    </div>
                </div>
            </HeaderProvider>
        </main>
    );
}