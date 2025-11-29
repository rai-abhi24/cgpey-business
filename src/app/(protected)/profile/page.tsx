"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { useSession } from "@/context/session-context";
import { Building2, Key, Webhook, Eye, EyeOff, Copy, Check, RefreshCcw } from "lucide-react";
import HeaderSetter from "@/components/common/header-setter";
import { toast } from "sonner";
import { ISession } from "@/types/session";

export default function ProfilePage() {
    const { session }: { session: ISession | null } = useSession();
    const queryClient = useQueryClient();

    const [visible, setVisible] = useState({
        uatPublic: false,
        uatSecret: false,
        prodPublic: false,
        prodSecret: false,
    });

    const [copied, setCopied] = useState("");

    const profileQuery = useQuery({
        queryKey: ["profile"],
        queryFn: async () => {
            const res = await fetch("/api/merchant/profile", { credentials: "include" });
            const json = await res.json();
            return json;
        },
    });
    console.log("profile", profileQuery.data);
    const profile = profileQuery.data?.profile;

    const [callbackForm, setCallbackForm] = useState({ uat: "", prod: "" });

    useEffect(() => {
        if (profile?.callbackUrls) {
            setCallbackForm({
                uat: profile.callbackUrls.uat || "",
                prod: profile.callbackUrls.prod || "",
            });
        }
    }, [profile]);

    const updateCallback = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/merchant/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ callbackUrls: callbackForm }),
            });

            return res.json();
        },
        onSuccess: () => {
            toast.success("Callback URLs updated");
            queryClient.invalidateQueries(["profile"] as any);
        },
    });

    const regenerateKey = useMutation({
        mutationFn: async ({ env, keyType }: any) => {
            const res = await fetch("/api/merchant/regenerate-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ env, keyType }),
            });
            return res.json();
        },
        onSuccess: () => {
            toast.success("Key regenerated");
            queryClient.invalidateQueries(["profile"] as any);
        },
    });

    const mask = (str: string) => {
        if (!str) return "";
        return str.slice(0, 6) + "••••••" + str.slice(-4);
    };

    const copy = (txt: string, field: string) => {
        navigator.clipboard.writeText(txt);
        setCopied(field);
        setTimeout(() => setCopied(""), 2000);
    };

    return (
        <div className="min-h-screen">
            <HeaderSetter title="Profile" desc="Your merchant account settings & API keys" />

            <div className="space-y-6">
                {/* BUSINESS INFO */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Building2 />
                            <CardTitle>Business Information</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-6">
                        <Info label="Merchant ID" value={session?.merchantId} badge />
                        <Info label="Business Name" value={profile?.businessName} />
                        <Info label="Email" value={profile?.email} />
                        <Info label="Phone" value={profile?.phone} />
                        <Info label="Website" value={profile?.website} />
                    </CardContent>
                </Card>

                {/* API KEYS */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Key />
                            <CardTitle>API Credentials</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-8">
                        {/* UAT */}
                        <KeyBlock
                            title="UAT Public Key"
                            value={profile?.apiKeys?.uat?.publicKey}
                            visible={visible.uatPublic}
                            onToggle={() => setVisible({ ...visible, uatPublic: !visible.uatPublic })}
                            onCopy={() => copy(profile?.apiKeys?.uat?.publicKey, "uatPublic")}
                            copied={copied === "uatPublic"}
                            onRegen={() => regenerateKey.mutate({ env: "uat", keyType: "public" })}
                        />

                        <KeyBlock
                            title="UAT Secret Key"
                            value={profile?.apiKeys?.uat?.secretKey}
                            visible={visible.uatSecret}
                            onToggle={() => setVisible({ ...visible, uatSecret: !visible.uatSecret })}
                            onCopy={() => copy(profile?.apiKeys?.uat?.secretKey, "uatSecret")}
                            copied={copied === "uatSecret"}
                            onRegen={() => regenerateKey.mutate({ env: "uat", keyType: "secret" })}
                        />

                        {/* PROD */}
                        <KeyBlock
                            title="PROD Public Key"
                            value={profile?.apiKeys?.prod?.publicKey}
                            visible={visible.prodPublic}
                            onToggle={() => setVisible({ ...visible, prodPublic: !visible.prodPublic })}
                            onCopy={() => copy(profile?.apiKeys?.prod?.publicKey, "prodPublic")}
                            copied={copied === "prodPublic"}
                            onRegen={() => regenerateKey.mutate({ env: "prod", keyType: "public" })}
                        />

                        <KeyBlock
                            title="PROD Secret Key"
                            value={profile?.apiKeys?.prod?.secretKey}
                            visible={visible.prodSecret}
                            onToggle={() => setVisible({ ...visible, prodSecret: !visible.prodSecret })}
                            onCopy={() => copy(profile?.apiKeys?.prod?.secretKey, "prodSecret")}
                            copied={copied === "prodSecret"}
                            onRegen={() => regenerateKey.mutate({ env: "prod", keyType: "secret" })}
                        />
                    </CardContent>
                </Card>

                {/* CALLBACK URLS */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Webhook />
                            <CardTitle>Webhook / Callback URLs</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <label className="text-sm font-medium">UAT Callback URL</label>
                        <Input
                            value={callbackForm.uat}
                            onChange={(e) => setCallbackForm({ ...callbackForm, uat: e.target.value })}
                            className="py-5 font-mono"
                            placeholder="https://your-uat-domain.com/callback"
                        />

                        <label className="text-sm font-medium">PROD Callback URL</label>
                        <Input
                            value={callbackForm.prod}
                            onChange={(e) => setCallbackForm({ ...callbackForm, prod: e.target.value })}
                            className="py-5 font-mono"
                            placeholder="https://your-prod-domain.com/callback"
                        />

                        <Button className="mt-4" onClick={() => updateCallback.mutate()}>
                            Save Callback URLs
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Info({ label, value, badge }: any) {
    return (
        <div>
            <p className="text-xs text-slate-500 uppercase">{label}</p>
            {badge ? (
                <Badge variant="outline" className="mt-1 font-mono">
                    {value}
                </Badge>
            ) : (
                <p className="text-base mt-1">{value || "-"}</p>
            )}
        </div>
    );
}

function KeyBlock({ title, value, visible, onToggle, onCopy, copied, onRegen }: any) {
    return (
        <div className="space-y-2">
            <label className="text-sm font-medium">{title}</label>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        type={visible ? "text" : "password"}
                        value={visible ? value : "••••••••••••••••"}
                        readOnly
                        className="font-mono py-5 pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        <Button variant="ghost" size="sm" onClick={onToggle}>
                            {visible ? <EyeOff /> : <Eye />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onCopy}>
                            {copied ? <Check className="text-green-600" /> : <Copy />}
                        </Button>
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={onRegen}>
                    <RefreshCcw className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}