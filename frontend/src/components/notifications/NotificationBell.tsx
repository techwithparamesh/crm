"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { notificationsApi, type NotificationItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 30000;

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await notificationsApi.list({ limit: 20 });
      setItems(res.items);
      setUnreadCount(res.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const t = setInterval(fetchNotifications, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      await notificationsApi.markAllAsRead();
      setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
      setUnreadCount(0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      <Button
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
          <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
            <span className="font-semibold text-sm">Notifications</span>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs rounded-lg" onClick={handleMarkAllRead} disabled={loading}>
                Mark all read
              </Button>
            )}
          </div>
          <div className="max-h-96 overflow-auto">
            {items.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted-foreground">No notifications yet. Task reminders, assignments, and mentions will appear here.</p>
            ) : (
              <ul className="divide-y divide-border">
                {items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "cursor-pointer px-4 py-3 text-sm transition-colors hover:bg-muted/50",
                      !n.readAt && "bg-primary/5"
                    )}
                    onClick={() => {
                      if (!n.readAt) handleMarkRead(n.id);
                      setOpen(false);
                      if (n.link) router.push(n.link);
                    }}
                  >
                    <div className="font-medium">{n.title}</div>
                    {n.message && <div className="text-muted-foreground truncate mt-0.5">{n.message}</div>}
                    <div className="text-xs text-muted-foreground mt-1">{formatTime(n.createdAt)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-border px-4 py-2 bg-muted/20">
            <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground rounded-lg" onClick={() => setOpen(false)}>
              View all notifications
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
