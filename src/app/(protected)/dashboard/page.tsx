"use client";

import { useSession } from "@/context/session-context";
import AdminDashboard from "./(components)/admin-dashboard";
import MerchantDashboard from "./(components)/merchant-dashboard";

export default function DashboardPage() {
    const { role } = useSession();

    if (role === "ADMIN") {
        return <AdminDashboard />;
    }

    return <MerchantDashboard />;
}