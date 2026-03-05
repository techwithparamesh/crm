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
  X,
  CheckSquare,
  LayoutTemplate,
  FileInput,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantBranding } from "@/hooks/useTenantBranding";

const nav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboards", label: "Dashboards", icon: BarChart3 },
  { href: "/modules", label: "Modules", icon: Layers },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/relationships", label: "Relationships", icon: Link2 },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/automations", label: "Automations", icon: Workflow },
  { href: "/forms", label: "Forms", icon: FileInput },
  { href: "/settings", label: "Settings", icon: Settings },
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";

function resolveLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl) return null;
  return logoUrl.startsWith("http") ? logoUrl : `${API_BASE}${logoUrl}`;
}

export interface ResponsiveSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ResponsiveSidebar({ open, onClose }: ResponsiveSidebarProps) {
  const pathname = usePathname();
  const { companyName, logoUrl, primaryColor } = useTenantBranding();
  const logoSrc = resolveLogoUrl(logoUrl);

  return (
    <>
      {/* Overlay on mobile when sidebar is open */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-56 border-r bg-card flex flex-col transition-transform duration-200 ease-out lg:relative lg:translate-x-0 lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold text-lg shrink-0 min-w-0"
            style={{ color: primaryColor }}
            onClick={onClose}
          >
            {logoSrc ? (
              <Image
                src={logoSrc}
                alt={companyName}
                width={28}
                height={28}
                className="object-contain shrink-0"
                unoptimized
              />
            ) : (
              <span
                className="w-7 h-7 rounded bg-primary/20 flex items-center justify-center text-xs font-bold shrink-0"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                C
              </span>
            )}
            <span className="truncate">{companyName}</span>
          </Link>
          <button
            type="button"
            className="lg:hidden p-2 rounded-md hover:bg-muted"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-2 flex-1 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
                pathname === href || pathname.startsWith(href + "/")
                  ? "font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={
                pathname === href || pathname.startsWith(href + "/")
                  ? { backgroundColor: `${primaryColor}15`, color: primaryColor }
                  : undefined
              }
              onClick={onClose}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
