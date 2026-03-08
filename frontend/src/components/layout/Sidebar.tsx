"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Link2,
  GitBranch,
  Workflow,
  BarChart3,
  Settings,
  FileBarChart,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const nav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboards", label: "Dashboards", icon: BarChart3 },
  { href: "/modules", label: "Modules", icon: Layers },
  { href: "/relationships", label: "Relationships", icon: Link2 },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", icon: Settings },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  return logoUrl.startsWith("http") ? logoUrl : `${API_BASE}${logoUrl}`;
}

export function Sidebar() {
  const pathname = usePathname();
  const { companyName, logoUrl, primaryColor } = useTenantBranding();
  const logoSrc = resolveLogoUrl(logoUrl);
  return (
    <aside className="w-56 border-r bg-card flex flex-col">
      <div className="p-4 border-b">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg" style={{ color: primaryColor }}>
          {logoSrc ? (
            <Image src={logoSrc} alt={companyName} width={28} height={28} className="object-contain shrink-0" unoptimized />
          ) : (
            <span className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-xs font-bold" style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}>C</span>
          )}
          {companyName}
        </Link>
      </div>
      <nav className="p-2 flex-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              pathname === href || pathname.startsWith(href + "/")
                ? "font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            style={pathname === href || pathname.startsWith(href + "/") ? { backgroundColor: `${primaryColor}15`, color: primaryColor } : undefined}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
