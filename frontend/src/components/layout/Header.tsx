"use client";

import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { QuickCreateMenu } from "@/components/layout/QuickCreateMenu";
import { UserMenu } from "@/components/layout/UserMenu";
import { Menu } from "lucide-react";

export interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, tenant } = useAuthStore();
  const { companyName } = useTenantBranding();
  const isApiUser = user?.id === "api";

  return (
    <div className="shrink-0">
      <div className="h-[3px] w-full bg-applyn-gradient" aria-hidden />
      <header className="h-14 border-b border-border bg-card flex items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0 rounded-lg"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm font-semibold text-foreground truncate hidden sm:inline">
          {tenant?.name ?? companyName}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end sm:justify-center max-w-xl">
        {!isApiUser && <GlobalSearch />}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 shrink-0">
        {!isApiUser && <QuickCreateMenu />}
        {!isApiUser && <NotificationBell />}
        <UserMenu />
        </div>
      </header>
    </div>
  );
}
