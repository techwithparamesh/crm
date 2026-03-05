"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import { authApi } from "@/lib/api";
import { ResponsiveSidebar } from "@/components/layout/ResponsiveSidebar";
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated());
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const tenant = useAuthStore((s) => s.tenant);
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated() && pathname !== "/login") router.push("/login");
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    if (token && tenant) {
      authApi.me().then(({ user }) => {
        setAuth(token, { ...user, permissions: user.permissions ?? null }, tenant);
      }).catch(() => {});
    }
  }, [token, setAuth, tenant]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!isAuthenticated()) return null;

  return (
    <div className="flex h-screen overflow-hidden">
      <ResponsiveSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 bg-muted/20 pb-20 md:pb-6">{children}</main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
