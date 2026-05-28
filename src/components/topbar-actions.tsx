"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function TopbarActions() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      const email = user.email ?? "";
      setUserEmail(email);

      supabase
        .from("scans")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("threat_level", "THREAT")
        .then(({ count }) => {
          setAlertCount(count ?? 0);
        });
    });
  }, []);

  const displayEmail =
    userEmail && userEmail.length > 20
      ? userEmail.slice(0, 20) + "…"
      : userEmail;

  return (
    <div className="flex items-center gap-3">
      {/* Alert bell */}
      <Link href="/alerts" className="relative w-7 h-7 flex items-center justify-center">
        <Bell className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        {alertCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-background" />
        )}
      </Link>

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