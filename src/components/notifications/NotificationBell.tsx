"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const refresh = useCallback(() => {
    fetch("/api/account/notifications", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => { if (data) setUnreadCount(data.unreadCount || 0); })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(refresh, 0);
    const interval = window.setInterval(refresh, 60_000);
    return () => { window.clearTimeout(timer); window.clearInterval(interval); };
  }, [refresh]);
  return <Link className="nature-notification-bell" href="/notifications" aria-label={unreadCount ? `Notifications, ${unreadCount} non lues` : "Notifications"}><Bell size={18} />{unreadCount > 0 && <span>{unreadCount > 9 ? "9+" : unreadCount}</span>}</Link>;
}
