"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
    Building2, Key, Webhook, Eye, EyeOff, Copy, Check,
    RefreshCcw, Globe, CreditCard, AlertTriangle, Plus, X, Shield
} from "lucide-react";
import { useState } from "react";
import HeaderSetter from "@/components/common/header-setter";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

interface IMerchant {
    merchantId: string;
    merchantName: string;
    businessName: string;
    businessEntityType: string;
    email: string;
    phone: string;
    website: string;

    // Webhook Config
    webhookConfig: {
        enabled: boolean;
        url: string;
        secret: string;
        maxRetries: number;
    };

    // IP Security (Max 3 IPs)
    allowedIPs?: string[];

    // API Keys
    apiKeys: {
        uat: { publicKey: string; secretKey: string };
        prod: { publicKey: string; secretKey: string };
    };

    // Modes
    activeMode: 'UAT' | 'PROD';
    canSwitchMode: boolean;
    isActive: boolean;

    // Limits
    perTransactionLimit: number;
    totalTransactions: number;
    totalVolume: number;

    // Timestamps
    createdAt: Date;
    updatedAt: Date;
}

export default function ProfilePage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState("overview");

    const [visible, setVisible] = useState({
        uatSecret: false,
        prodSecret: false,
        webhookSecret: false,
    });

    const [copied, setCopied] = useState("");
    const [newIP, setNewIP] = useState("");

    const { data: profileData, isLoading } = useQuery<{ profile: IMerchant }>({
        queryKey: ["merchant-profile"],
        queryFn: async () => {
            const res = await fetch("/api/merchant/profile", {
                credentials: "include",
                cache: 'no-store'
            });
            if (!res.ok) throw new Error("Failed to fetch profile");
            return res.json();
        },
        refetchOnWindowFocus: false,
    });

    const profile = profileData?.profile;

    // Initialize webhook form
    const [webhookForm, setWebhookForm] = useState({
        enabled: true,
        url: "",
        secret: "",
        maxRetries: 3,
    });

    // Initialize IPs from profile
    const [ipAddresses, setIpAddresses] = useState<string[]>([]);

    // Initialize forms when profile loads
    useState(() => {
        if (profile) {
            setWebhookForm({
                enabled: profile.webhookConfig?.enabled ?? true,
                url: profile.webhookConfig?.url || "",
                secret: profile.webhookConfig?.secret || "",
                maxRetries: profile.webhookConfig?.maxRetries || 3,
            });
            setIpAddresses(profile.allowedIPs || []);
        }
    });

    // Update webhook configuration
    const updateWebhookMutation = useMutation({
        mutationFn: async (data: typeof webhookForm) => {
            const res = await fetch("/api/merchant/profile/webhook", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(data),
            });
            if (!res.ok) throw new Error("Update failed");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Webhook configuration updated");
            queryClient.invalidateQueries();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Update failed");
        },
    });

    // Update IP whitelist
    const updateIPsMutation = useMutation({
        mutationFn: async (ips: string[]) => {
            const res = await fetch("/api/merchant/profile/ips", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ allowedIPs: ips }),
            });
            if (!res.ok) throw new Error("Update failed");
            return res.json();
        },
        onSuccess: () => {
            toast.success("IP whitelist updated");
            queryClient.invalidateQueries();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Update failed");
        },
    });

    // Regenerate API keys
    const regenerateKey = useMutation({
        mutationFn: async ({ env, keyType }: { env: 'uat' | 'prod'; keyType: 'public' | 'secret' }) => {
            const res = await fetch("/api/merchant/regenerate-key", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ env, keyType }),
                credentials: "include",
            });
            if (!res.ok) throw new Error("Regeneration failed");
            return res.json();
        },
        onSuccess: (data, variables) => {
            toast.success(`${variables.env.toUpperCase()} ${variables.keyType} key regenerated`);
            queryClient.invalidateQueries();
        },
        onError: (error: Error) => {
            toast.error(error.message || "Regeneration failed");
        },
    });

    // Copy to clipboard
    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(""), 2000);
        toast.success("Copied to clipboard");
    };

    // IP address management
    const handleAddIP = () => {
        if (!newIP.trim()) {
            toast.error("Please enter an IP address");
            return;
        }

        // Basic IP validation
        const ipRegex = /^(?:\d{1,3}\.){3}\d{1,3}$/;
        if (!ipRegex.test(newIP)) {
            toast.error("Please enter a valid IP address (IPv4)");
            return;
        }

        if (ipAddresses.includes(newIP)) {
            toast.error("IP address already exists");
            return;
        }

        if (ipAddresses.length >= 3) {
            toast.error("Maximum 3 IP addresses allowed");
            return;
        }

        const newIPs = [...ipAddresses, newIP];
        setIpAddresses(newIPs);
        updateIPsMutation.mutate(newIPs);
        setNewIP("");
    };

    const handleRemoveIP = (index: number) => {
        const newIPs = ipAddresses.filter((_, i) => i !== index);
        setIpAddresses(newIPs);
        updateIPsMutation.mutate(newIPs);
    };

    const handleSaveWebhook = () => {
        if (webhookForm.enabled && !webhookForm.url) {
            toast.error("Webhook URL is required when webhooks are enabled");
            return;
        }

        updateWebhookMutation.mutate(webhookForm);
    };

    const generateSecret = () => {
        const secret = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 10)}`;
        setWebhookForm({ ...webhookForm, secret });
        toast.success("New secret generated");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            <HeaderSetter
                title="Merchant Profile"
                desc="Manage your merchant account, API keys, and webhooks"
            />

            <div className="container mx-auto p-4 md:p-6">
                {/* Main Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid grid-cols-2 md:grid-cols-3">
                        <TabsTrigger value="overview" className="py-3">Overview</TabsTrigger>
                        <TabsTrigger value="api" className="py-3">API Keys</TabsTrigger>
                        <TabsTrigger value="webhooks" className="py-3">Webhooks & IPs</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5" />
                                    Merchant Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid md:grid-cols-2 gap-6">
                                <Info label="Merchant ID" value={profile?.merchantId} badge />
                                <Info label="Business Name" value={profile?.businessName} />
                                <Info label="Legal Name" value={profile?.merchantName} />
                                <Info label="Business Type" value={profile?.businessEntityType} />
                                <Info label="Email" value={profile?.email} />
                                <Info label="Phone" value={profile?.phone} />
                                <Info label="Website" value={profile?.website} />
                                <Info label="Account Status" value={profile?.isActive ? "Active" : "Inactive"} />
                            </CardContent>
                        </Card>

                        <div className="grid md:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <CreditCard className="h-5 w-5" />
                                        Transaction Limits
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Info label="Per Transaction Limit" value={`₹${profile?.perTransactionLimit?.toLocaleString()}`} />
                                    <Info label="Can Switch Mode" value={profile?.canSwitchMode ? "Yes" : "No"} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Globe className="h-5 w-5" />
                                        Environment Settings
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Info label="Active Mode" value={profile?.activeMode} badge />
                                    <Info label="Mode Switching" value={profile?.canSwitchMode ? "Enabled" : "Disabled"} />
                                    <Info label="Account Created" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "-"} />
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* API Keys Tab */}
                    <TabsContent value="api" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Key className="h-5 w-5" />
                                    API Credentials
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-8">
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-primary">UAT Environment (Testing)</h3>
                                    <KeyBlock
                                        title="Public Key"
                                        value={profile?.apiKeys?.uat?.publicKey}
                                        visible={true}
                                        onCopy={() => copyToClipboard(profile?.apiKeys?.uat?.publicKey || "", "uatPublic")}
                                        copied={copied === "uatPublic"}
                                        onRegen={() => regenerateKey.mutate({ env: 'uat', keyType: 'public' })}
                                    />
                                    <KeyBlock
                                        title="Secret Key"
                                        value={profile?.apiKeys?.uat?.secretKey}
                                        visible={visible.uatSecret}
                                        onToggle={() => setVisible({ ...visible, uatSecret: !visible.uatSecret })}
                                        onCopy={() => copyToClipboard(profile?.apiKeys?.uat?.secretKey || "", "uatSecret")}
                                        copied={copied === "uatSecret"}
                                        onRegen={() => regenerateKey.mutate({ env: 'uat', keyType: 'secret' })}
                                    />
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-destructive">PROD Environment (Live)</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Use these keys only for production transactions. Regenerate immediately if compromised.
                                    </p>
                                    <KeyBlock
                                        title="Public Key"
                                        value={profile?.apiKeys?.prod?.publicKey}
                                        visible={true}
                                        onCopy={() => copyToClipboard(profile?.apiKeys?.prod?.publicKey || "", "prodPublic")}
                                        copied={copied === "prodPublic"}
                                        onRegen={() => regenerateKey.mutate({ env: 'prod', keyType: 'public' })}
                                    />
                                    <KeyBlock
                                        title="Secret Key"
                                        value={profile?.apiKeys?.prod?.secretKey}
                                        visible={visible.prodSecret}
                                        onToggle={() => setVisible({ ...visible, prodSecret: !visible.prodSecret })}
                                        onCopy={() => copyToClipboard(profile?.apiKeys?.prod?.secretKey || "", "prodSecret")}
                                        copied={copied === "prodSecret"}
                                        onRegen={() => regenerateKey.mutate({ env: 'prod', keyType: 'secret' })}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Security Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <span className="text-destructive">•</span>
                                        <span>Never share your secret keys with anyone</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-destructive">•</span>
                                        <span>Regenerate keys immediately if compromised</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-destructive">•</span>
                                        <span>Use UAT keys for testing, PROD for live transactions only</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-destructive">•</span>
                                        <span>Store secret keys in environment variables, never in code</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-destructive">•</span>
                                        <span>Use IP whitelisting for additional security</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Webhooks & IPs Tab */}
                    <TabsContent value="webhooks" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Webhook className="h-5 w-5" />
                                    Webhook Configuration
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {webhookForm.enabled && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <div>
                                            <Label htmlFor="webhook-url">
                                                Webhook URL <span className="text-destructive">*</span>
                                            </Label>
                                            <Input
                                                id="webhook-url"
                                                value={webhookForm.url}
                                                onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                                                placeholder="https://your-domain.com/api/webhooks/payment"
                                                className="font-mono py-6 mt-2"
                                            />
                                            <p className="text-sm text-muted-foreground mt-1">
                                                We&apos;ll send POST requests to this URL with payment status updates
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5" />
                                    IP Address Whitelisting
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="new-ip">Add IP Address (IPv4)</Label>
                                    <p className="text-sm text-muted-foreground mb-2">
                                        Maximum 3 IP addresses allowed for API access
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            id="new-ip"
                                            value={newIP}
                                            onChange={(e) => setNewIP(e.target.value)}
                                            placeholder="192.168.1.1"
                                            className="font-mono py-6"
                                            disabled={ipAddresses.length >= 3}
                                        />
                                        <Button
                                            onClick={handleAddIP}
                                            disabled={ipAddresses.length >= 3 || !newIP.trim()}
                                            className="py-6"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add
                                        </Button>
                                    </div>
                                </div>

                                {ipAddresses.length > 0 && (
                                    <div className="space-y-2">
                                        <Label>Allowed IP Addresses ({ipAddresses.length}/3)</Label>
                                        <div className="space-y-2">
                                            {ipAddresses.map((ip, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="font-mono">
                                                            {ip}
                                                        </Badge>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveIP(index)}
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {ipAddresses.length === 0 && (
                                    <div className="text-center p-6 border rounded-lg bg-muted/50">
                                        <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground">No IP addresses whitelisted yet</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Add IPs to restrict API access to specific servers
                                        </p>
                                    </div>
                                )}

                                <div className="pt-4 border-t">
                                    <Button
                                        onClick={handleSaveWebhook}
                                        disabled={updateWebhookMutation.isPending || updateIPsMutation.isPending}
                                        className="w-full py-6"
                                    >
                                        {updateWebhookMutation.isPending || updateIPsMutation.isPending
                                            ? "Saving..."
                                            : "Save All Changes"}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

// Reusable Components
function Info({ label, value, badge }: { label: string; value?: string | number; badge?: boolean }) {
    return (
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            {badge ? (
                <Badge variant="outline" className="mt-1 font-mono text-sm">
                    {value || "-"}
                </Badge>
            ) : (
                <p className="text-base mt-1 font-medium">{value || "-"}</p>
            )}
        </div>
    );
}

function KeyBlock({
    title,
    value,
    visible,
    onToggle,
    onCopy,
    copied,
    onRegen
}: {
    title: string;
    value?: string;
    visible: boolean;
    onToggle?: () => void;
    onCopy: () => void;
    copied: boolean;
    onRegen: () => void;
}) {
    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Input
                        type={visible ? "text" : "password"}
                        value={visible ? value : "••••••••••••••••"}
                        readOnly
                        className="font-mono pr-24 py-6"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {onToggle && (
                            <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 w-8 p-0">
                                {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={onCopy} className="h-8 w-8 p-0">
                            {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={onRegen} className="py-6">
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Regenerate
                </Button>
            </div>
        </div>
    );
}