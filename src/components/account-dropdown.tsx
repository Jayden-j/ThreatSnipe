"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export function AccountDropdown() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
      if (user?.user_metadata?.avatar_url) setAvatarUrl(user.user_metadata.avatar_url as string);
      const name = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? null;
      if (name) setDisplayName(name as string);
    });
  }, []);

  const initial = userEmail ? userEmail.charAt(0).toUpperCase() : "?";
  const displayEmail =
    userEmail && userEmail.length > 24 ? userEmail.slice(0, 24) + "…" : userEmail;

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary hover:bg-primary/30 transition-colors outline-none cursor-pointer overflow-hidden"
          aria-label="Account menu"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            initial
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {userEmail && (
          <>
            <div className="flex items-center gap-2.5 px-2 py-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-semibold text-primary">{initial}</span>
                )}
              </div>
              <div className="min-w-0">
                {displayName && (
                  <p className="truncate text-xs font-semibold text-foreground">{displayName}</p>
                )}
                <p className="truncate text-xs font-normal text-muted-foreground">{displayEmail}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings className="opacity-60" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          document.documentElement.classList.add("theme-transitioning");
          setTheme(theme === "dark" ? "light" : "dark");
          setTimeout(() => {
            document.documentElement.classList.remove("theme-transitioning");
          }, 700);
        }}>
          {theme === "dark" ? (
            <Sun className="opacity-60" />
          ) : (
            <Moon className="opacity-60" />
          )}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="opacity-60" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
