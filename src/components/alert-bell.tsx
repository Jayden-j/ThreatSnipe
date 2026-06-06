"use client";

import { Bell } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { usePathname, useRouter } from "next/navigation";

export function AlertBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [latestUnreadId, setLatestUnreadId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);
  const channelCounterRef = useRef(0);

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
        setLatestUnreadId(data && data.length > 0 ? data[0].id : null);
      }
    } catch {
      // silently fail
    }
  }, []);

  const handleBellClick = useCallback(async () => {
    if (!userId) return;
    const supabase = createClient();
    try {
      await supabase
        .from("alerts")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);
      if (isMounted.current) setUnreadCount(0);
    } catch {
      // silently fail
    }
    router.push(`/alerts${latestUnreadId ? `?highlight=${latestUnreadId}` : ""}`);
  }, [userId, latestUnreadId, router]);

  useEffect(() => {
    isMounted.current = true;
    const supabase = createClient();
    const mountGeneration = ++channelCounterRef.current;
    const channelName = `alerts-bell-${mountGeneration}`;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!isMounted.current || mountGeneration !== channelCounterRef.current) return;
      if (!user) return;

      setUserId(user.id);
      fetchUnreadData(supabase, user.id);

      const ch = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "alerts", filter: `user_id=eq.${user.id}` },
          (payload) => {
            if (isMounted.current) {
              setUnreadCount((prev) => prev + 1);
              setLatestUnreadId(payload.new.id as string);
            }
          }
        )
        .subscribe();

      if (isMounted.current) {
        channelRef.current = ch;
      } else {
        supabase.removeChannel(ch);
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

  // Auto-clear badge when on alerts page
  useEffect(() => {
    if (pathname === "/alerts" && userId) {
      const supabase = createClient();
      supabase
        .from("alerts")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false)
        .then(() => { if (isMounted.current) setUnreadCount(0); })
        .catch(() => {});
    }
  }, [pathname, userId]);

  return (
    <button
      onClick={handleBellClick}
      className="relative w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition-colors"
      aria-label="Alerts"
    >
      <Bell className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-background px-1">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
