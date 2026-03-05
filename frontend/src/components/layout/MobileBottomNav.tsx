"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  GitBranch,
  BarChart3,
  Settings,
  CheckSquare,
  LayoutTemplate,
  FileInput,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/modules", label: "Modules", icon: Layers },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/forms", label: "Forms", icon: FileInput },
  { href: "/pipelines", label: "Pipelines", icon: GitBranch },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/dashboards", label: "Charts", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t bg-card md:hidden pb-[env(safe-area-inset-bottom)]">
      {nav.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 py-2 px-2 min-w-0 flex-1 text-xs transition-colors",
              isActive ? "text-primary font-medium" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate max-w-full">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
