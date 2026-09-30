"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { NOTIFICATIONS_UPDATED_EVENT } from "@/lib/notification-events";

export default function NotificationBell() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let disposed = false;
    let activeRequest: AbortController | null = null;

    async function refresh() {
      if (document.visibilityState === "hidden") return;
      activeRequest?.abort();
      const requestController = new AbortController();
      activeRequest = requestController;
      try {
        const response = await fetch("/api/account/notifications", {
          cache: "no-store",
          signal: requestController.signal,
        });
        if (!response.ok) return;
        const data: { unreadCount?: unknown } = await response.json();
        if (disposed || activeRequest !== requestController) return;
        const count = Number(data.unreadCount);
        setUnreadCount(Number.isFinite(count) ? Math.max(0, count) : 0);
      } catch {
        // Keep the last known count while the network is unavailable.
      } finally {
        if (activeRequest === requestController) activeRequest = null;
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(() => void refresh(), 60_000);
    window.addEventListener("focus", refresh);
    window.addEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
    document.addEventListener("visibilitychange", onVisibilityChange);
    void refresh();

    return () => {
      disposed = true;
      activeRequest?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(NOTIFICATIONS_UPDATED_EVENT, refresh);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const label = unreadCount > 0
    ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
    : "Notifications";

  return (
    <Link
      className="nature-notification-bell"
      href="/notifications"
      aria-label={label}
      aria-current={pathname === "/notifications" ? "page" : undefined}
      title={label}
    >
      <Bell size={19} aria-hidden="true" />
      {unreadCount > 0 && <span aria-hidden="true">{unreadCount > 99 ? "99+" : unreadCount}</span>}
    </Link>
  );
}
