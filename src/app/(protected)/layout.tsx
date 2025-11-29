import { redirect } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import { HeaderProvider } from "@/context/header-context";
import { SessionProvider } from "@/context/session-context";
import { getSession } from "@/lib/session/session";
import type { ReactNode } from "react";

interface ProtectedLayoutProps {
    children: ReactNode;
}

export default async function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <SessionProvider initialSession={session}>
            <main className="flex h-screen">
                <div className="flex-shrink-0">
                    <Sidebar />
                </div>

                <HeaderProvider initial={{ title: "Dashboard", desc: "Welcome to your dashboard" }}>
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex-shrink-0">
                            <Header />
                        </div>

                        <div className="flex-1 p-3 md:p-6 bg-gray-50 overflow-y-auto">
                            <div className="max-h-full">{children}</div>
                        </div>
                    </div>
                </HeaderProvider>
            </main>
        </SessionProvider>
    );
}