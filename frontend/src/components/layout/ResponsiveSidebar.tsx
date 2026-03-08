"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  FileBarChart,
  PanelLeftClose,
  PanelLeft,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { Button } from "@/components/ui/button";
import { ApplynLogoOrCustom } from "@/components/brand/ApplynLogoOrCustom";

const SIDEBAR_COLLAPSED_KEY = "crm-sidebar-collapsed";

const navGroups: { label: string; items: { href: string; label: string; icon: LucideIcon }[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/dashboards", label: "Dashboards", icon: BarChart3 },
    ],
  },
  {
    label: "Data",
    items: [
      { href: "/modules", label: "Modules", icon: Layers },
      { href: "/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/relationships", label: "Relationships", icon: Link2 },
      { href: "/pipelines", label: "Pipelines", icon: GitBranch },
    ],
  },
  {
    label: "Work",
    items: [
      { href: "/tasks", label: "Tasks", icon: CheckSquare },
      { href: "/automations", label: "Automations", icon: Workflow },
      { href: "/forms", label: "Forms", icon: FileInput },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/reports", label: "Reports", icon: FileBarChart },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
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
  const { companyName, logoUrl } = useTenantBranding();
  const logoSrc = resolveLogoUrl(logoUrl);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SIDEBAR_COLLAPSED_KEY) : null;
    setCollapsed(stored === "1");
  }, []);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    if (typeof window !== "undefined") localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
  };

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
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
          "fixed top-0 left-0 z-50 h-full border-r bg-card flex flex-col transition-[width] duration-200 ease-out lg:relative lg:translate-x-0 lg:z-auto shrink-0",
          open ? "translate-x-0" : "-translate-x-full",
          "w-56",
          collapsed && "lg:w-[3.5rem]"
        )}
      >
        <div className={cn("border-b flex items-center shrink-0", collapsed ? "p-2 justify-center lg:justify-center" : "p-4 justify-between")}>
          <Link
            href="/dashboard"
            className={cn("flex items-center font-semibold shrink-0 min-w-0", collapsed ? "justify-center w-full" : "gap-2 text-lg")}
            onClick={onClose}
          >
            <ApplynLogoOrCustom size={40} showText={!collapsed} textSize="sm" />
            {logoSrc && !collapsed && <span className="truncate text-muted-foreground">{companyName}</span>}
          </Link>
          {!collapsed && (
            <button
              type="button"
              className="lg:hidden p-2 rounded-md hover:bg-muted"
              onClick={onClose}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <nav className="p-2 flex-1 overflow-y-auto space-y-4">
          {navGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.label}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center rounded-lg text-sm transition-colors",
                      collapsed ? "justify-center px-2 py-2.5" : "gap-2 px-3 py-2.5",
                      isActive(href)
                        ? "font-medium bg-violet-50 dark:bg-violet-950/30 border-l-2 border-violet-500 text-violet-700 dark:text-violet-300"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border-l-2 border-transparent"
                    )}
                    onClick={onClose}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>{label}</span>}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className={cn("p-2 border-t hidden lg:block", collapsed && "flex justify-center")}>
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            className="w-full justify-center text-muted-foreground"
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4 mr-2" /> Collapse</>}
          </Button>
        </div>
      </aside>
    </>
  );
}
