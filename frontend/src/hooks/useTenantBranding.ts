"use client";

import { useState, useEffect, useCallback } from "react";
import { tenantApi, type TenantBranding } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

const DEFAULT_PRIMARY = "hsl(262 83% 58%)";
const DEFAULT_APP_NAME = "Applyn CRM";

export interface UseTenantBrandingResult {
  companyName: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string | null;
  favicon: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Fetches tenant branding (logo, colors, company name, favicon).
 * When logged in, backend uses JWT tenant. When on custom domain, backend uses Host header.
 * Pass tenantId when not logged in to resolve branding (e.g. login page with selected tenant).
 */
export function useTenantBranding(tenantId?: string | null): UseTenantBrandingResult {
  const storeTenantId = useAuthStore((s) => s.tenant?.id);
  const token = useAuthStore((s) => s.token);
  // When authenticated, backend uses JWT; only pass tenantId when not logged in (e.g. login page)
  const queryTenantId = token ? undefined : (tenantId ?? storeTenantId ?? undefined);

  const [data, setData] = useState<TenantBranding | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await tenantApi.getBranding(queryTenantId);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load branding");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [queryTenantId]);

  useEffect(() => {
    fetchBranding();
  }, [fetchBranding]);

  // Inject primary color and favicon into document when branding loads
  useEffect(() => {
    if (typeof document === "undefined" || !data) return;
    const root = document.documentElement;
    const primary = data.primaryColor || DEFAULT_PRIMARY;
    root.style.setProperty("--tenant-primary", primary);
    if (data.secondaryColor) root.style.setProperty("--tenant-secondary", data.secondaryColor);

    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][data-tenant]');
    if (data.faviconUrl) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        link.setAttribute("data-tenant", "true");
        document.head.appendChild(link);
      }
      link.href = data.faviconUrl.startsWith("http") ? data.faviconUrl : `${process.env.NEXT_PUBLIC_API_URL || ""}${data.faviconUrl}`;
    } else if (link) {
      link.remove();
    }
  }, [data]);

  return {
    companyName: data?.companyName ?? DEFAULT_APP_NAME,
    logoUrl: data?.logoUrl ?? null,
    primaryColor: data?.primaryColor ?? DEFAULT_PRIMARY,
    secondaryColor: data?.secondaryColor ?? null,
    favicon: data?.faviconUrl ?? null,
    loading,
    error,
    refetch: fetchBranding,
  };
}
