"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Sun, Moon, Bell, Check, Loader2, Menu } from "lucide-react";
import { getRecentNotifications, markAsRead, markAllAsRead } from "@/actions/notifications";
import { GlobalSearch } from "./GlobalSearch";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchNotifications();
    
    // Poll notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    const res = await getRecentNotifications();
    if (res.success) {
      setNotifications(res.notifications);
    }
  };

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const res = await markAsRead(id);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    }
  };

  const handleMarkAllAsRead = async () => {
    setLoadingNotifications(true);
    const res = await markAllAsRead();
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
    setLoadingNotifications(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Breadcrumbs generator
  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean);
    return segments.map((seg, idx) => {
      const href = "/" + segments.slice(0, idx + 1).join("/");
      const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace("-", " ");
      const isLast = idx === segments.length - 1;

      return (
        <span key={href} className="flex items-center text-xs sm:text-sm">
          {idx > 0 && <span className="mx-2 text-zinc-300 dark:text-zinc-700">/</span>}
          {isLast ? (
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">{label}</span>
          ) : (
            <span className="text-zinc-500">{label}</span>
          )}
        </span>
      );
    });
  };

  if (!mounted) {
    return (
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        <div className="flex gap-4">
          <div className="h-8 w-8 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
          <div className="h-8 w-8 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-200 bg-white/85 px-6 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80">
      {/* Left Path Info */}
      <div className="flex items-center gap-1.5">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="mr-1 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 md:hidden"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        {getBreadcrumbs()}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Command Search */}
        <GlobalSearch />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Notification center */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="View notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 text-[10px] font-bold text-white ring-2 ring-white dark:bg-white dark:text-zinc-950 dark:ring-zinc-900">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div
                onClick={() => setShowNotifications(false)}
                className="fixed inset-0 z-30 bg-transparent"
              />
              <div className="absolute right-0 mt-2 z-40 w-80 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2.5 dark:border-zinc-800">
                  <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      disabled={loadingNotifications}
                      className="flex items-center text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
                    >
                      {loadingNotifications ? (
                        <Loader2 className="h-3 w-3 animate-spin mr-1" />
                      ) : (
                        <Check className="h-3.5 w-3.5 mr-1" />
                      )}
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-[300px] overflow-y-auto py-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      No recent notifications
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        className={`flex flex-col gap-1 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                          !n.read ? "bg-zinc-50/75 dark:bg-zinc-800/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                            {n.title}
                          </span>
                          {!n.read && (
                            <button
                              onClick={(e) => handleMarkAsRead(n._id, e)}
                              className="rounded-full p-0.5 text-zinc-400 hover:bg-zinc-150 hover:text-zinc-650 dark:hover:bg-zinc-700"
                              title="Mark as read"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
export default Header;
