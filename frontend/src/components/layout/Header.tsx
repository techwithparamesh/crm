"use client";

import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTenantBranding } from "@/hooks/useTenantBranding";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { Menu } from "lucide-react";

export interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, tenant, logout } = useAuthStore();
  const router = useRouter();
  const { companyName } = useTenantBranding();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isApiUser = user?.id === "api";

  return (
    <header className="h-14 border-b bg-card flex items-center justify-between gap-2 px-3 sm:px-4 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="text-sm text-muted-foreground font-medium truncate hidden sm:inline">
          {tenant?.name ?? companyName}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end sm:justify-center max-w-md">
        {!isApiUser && <GlobalSearch />}
      </div>
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {!isApiUser && <NotificationBell />}
        <span className="text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{user?.name ?? user?.email}</span>
        <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
          Log out
        </Button>
      </div>
    </header>
  );
}
