"use client";

import { Bell, Menu } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";

export function TopbarActions({
  onMenuClick,
}: {
  onMenuClick?: () => void;
}) {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestUnreadId, setLatestUnreadId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  // Fetch unread alert count + latest unread ID
  const fetchUnreadData = useCallback(async (supabase: ReturnType<typeof createClient>, uid: string) => {
    try {
      const { data, count } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("read", false)
        .order("created_at", { ascending: false })
        .limit(1);

      if (isMounted.current) {
        setUnreadCount(count ?? 0);
        if (data && data.length > 0) {
          setLatestUnreadId(data[0].id);
        } else {
          setLatestUnreadId(null);
        }
      }
    } catch {
      // Silently fail
    }
  }, []);

  // Mark all alerts as read, then navigate to /alerts with highlight
  const handleBellClick = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    try {
      await supabase
        .from("alerts")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (isMounted.current) {
        setUnreadCount(0);
      }
    } catch {
      // Silently fail
    }

    const highlightParam = latestUnreadId ? `?highlight=${latestUnreadId}` : "";
    router.push(`/alerts${highlightParam}`);
  }, [userId, latestUnreadId, router]);

  useEffect(() => {
    isMounted.current = true;
    const supabase = createClient();

    // Remove any previous channel before creating a new one
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user || !isMounted.current) return;

      const email = user.email ?? "";
      const uid = user.id;
      setUserEmail(email);
      setUserId(uid);

      // Initial fetch
      fetchUnreadData(supabase, uid);

      // Subscribe to real-time INSERT on alerts table
      const alertsChannel = supabase
        .channel("alerts-unread")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "alerts",
            filter: `user_id=eq.${uid}`,
          },
          (payload) => {
            if (isMounted.current) {
              setUnreadCount((prev) => prev + 1);
              setLatestUnreadId(payload.new.id as string);
            }
          }
        )
        .subscribe();

      if (isMounted.current) {
        channelRef.current = alertsChannel;
      } else {
        supabase.removeChannel(alertsChannel);
      }
    });

    return () => {
      isMounted.current = false;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchUnreadData]);

  // When navigating to /alerts, mark all as read
  useEffect(() => {
    if (pathname === "/alerts" && userId) {
      const supabase = createClient();
      (async () => {
        try {
          await supabase
            .from("alerts")
            .update({ read: true })
            .eq("user_id", userId)
            .eq("read", false);
          if (isMounted.current) {
            setUnreadCount(0);
          }
        } catch {
          // Silently fail
        }
      })();
    }
  }, [pathname, userId]);

  const displayEmail =
    userEmail && userEmail.length > 20
      ? userEmail.slice(0, 20) + "…"
      : userEmail;

  return (
    <div className="flex items-center gap-3">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden w-7 h-7 flex items-center justify-center"
      >
        <Menu className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
      </button>

      {/* Alert bell */}
      <button
        onClick={handleBellClick}
        className="relative w-7 h-7 flex items-center justify-center"
      >
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* User avatar + email */}
      {userEmail && (
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {userEmail.charAt(0).toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-muted-foreground max-w-[120px] truncate">
            {displayEmail}
          </span>
        </div>
      )}
    </div>
  );
}