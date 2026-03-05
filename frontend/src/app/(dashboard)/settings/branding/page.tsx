"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { tenantApi, type TenantSettings } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveUrl(url: string | null): string | null {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BrandingSettingsPage() {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7c3aed");
  const [secondaryColor, setSecondaryColor] = useState("");
  const [customDomain, setCustomDomain] = useState("");

  useEffect(() => {
    tenantApi
      .getSettings()
      .then((s) => {
        setSettings(s);
        setCompanyName(s.companyName ?? "");
        setPrimaryColor(s.primaryColor || "#7c3aed");
        setSecondaryColor(s.secondaryColor ?? "");
        setCustomDomain(s.customDomain ?? "");
      })
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setError("");
    setSaving(true);
    try {
      const updated = await tenantApi.updateSettings({
        companyName: companyName.trim() || null,
        primaryColor: primaryColor.trim() || null,
        secondaryColor: secondaryColor.trim() || null,
        customDomain: customDomain.trim() || null,
      });
      setSettings(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError("");
    try {
      const data = await fileToBase64(file);
      const { url } = await tenantApi.uploadImage("logo", data);
      await tenantApi.updateSettings({ logoUrl: url });
      setSettings((s) => (s ? { ...s, logoUrl: url } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logo upload failed");
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setError("");
    try {
      const data = await fileToBase64(file);
      const { url } = await tenantApi.uploadImage("favicon", data);
      await tenantApi.updateSettings({ faviconUrl: url });
      setSettings((s) => (s ? { ...s, faviconUrl: url } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Favicon upload failed");
    }
  };

  if (loading) return <div className="p-6">Loading…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/settings">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">Branding & White Label</h1>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Company & colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Company name</Label>
            <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme Inc" className="mt-1" />
          </div>
          <div>
            <Label>Primary color</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#7c3aed" className="flex-1 font-mono" />
            </div>
          </div>
          <div>
            <Label>Secondary color (optional)</Label>
            <div className="flex gap-2 mt-1">
              <input type="color" value={secondaryColor || "#e2e8f0"} onChange={(e) => setSecondaryColor(e.target.value)} className="h-10 w-14 rounded border cursor-pointer" />
              <Input value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} placeholder="#e2e8f0" className="flex-1 font-mono" />
            </div>
          </div>
          <div>
            <Label>Custom domain (e.g. crm.yourcompany.com)</Label>
            <Input value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="crm.yourcompany.com" className="mt-1" />
          </div>
          <Button onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Logo & favicon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Logo</Label>
            <div className="flex items-center gap-4 mt-2">
              {settings?.logoUrl && (
                <Image src={resolveUrl(settings.logoUrl) ?? ""} alt="Logo" width={80} height={40} className="object-contain border rounded" unoptimized />
              )}
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 bg-primary text-primary-foreground hover:bg-primary/90">Upload logo</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
              </label>
            </div>
          </div>
          <div>
            <Label>Favicon</Label>
            <div className="flex items-center gap-4 mt-2">
              {settings?.faviconUrl && (
                <Image src={resolveUrl(settings.faviconUrl) ?? ""} alt="Favicon" width={32} height={32} className="object-contain border rounded" unoptimized />
              )}
              <label className="cursor-pointer">
                <span className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 border border-input bg-background hover:bg-accent">Upload favicon</span>
                <input type="file" accept="image/*" className="sr-only" onChange={handleFaviconUpload} />
              </label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
