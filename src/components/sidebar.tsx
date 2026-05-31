"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  LayoutDashboard,
  Search,
  History,
  Settings,
  Shield,
  LogOut,
  Globe,
  ScanLine,
  List,
  Network,
  FileText,
  Lock,
  Mail,
  Activity,
  ClipboardList,
  FolderKanban,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/lookup", label: "IP Lookup", icon: Search },
  { href: "/domain", label: "Domain Lookup", icon: Globe },
  { href: "/ports", label: "Port Scanner", icon: ScanLine },
  { href: "/blacklist", label: "Blacklist Check", icon: List },
  { href: "/dns", label: "DNS Records", icon: Network },
  { href: "/whois", label: "WHOIS Lookup", icon: FileText },
  { href: "/history", label: "Scan History", icon: History },
  { href: "/assets", label: "Assets", icon: FolderKanban },
  { href: "/settings", label: "Settings", icon: Settings },
  // Tools group (no visual separator — just appended)
  { href: "/ssl", label: "SSL Checker", icon: Lock },
  { href: "/email-security", label: "Email Security", icon: Mail },
  { href: "/server-status", label: "Server Status", icon: Activity },
  { href: "/bulk", label: "Bulk Check", icon: ClipboardList },
];

export function Sidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleNavClick = () => {
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r border-border bg-sidebar transition-transform duration-300",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Branding */}
        <div className="flex items-center gap-2 border-b border-border px-6 h-14">
          <Image src="/logo.png" alt="Centry" width={28} height={28} className="rounded-sm" />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Centry
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer / Sign Out */}
        <div className="border-t border-border px-3 py-4">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}