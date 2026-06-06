"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Search,
  Globe,
  ScanLine,
  List,
  Network,
  FileText,
  Lock,
  Mail,
  Activity,
  ClipboardList,
  History,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const snipeItems = [
  { href: "/lookup", label: "Abuse Checker", icon: Search },
  { href: "/domain", label: "VirusTotal Check", icon: Globe },
  { href: "/ports", label: "Port Scanner", icon: ScanLine },
  { href: "/blacklist", label: "Blacklist Check", icon: List },
  { href: "/dns", label: "DNS Records", icon: Network },
  { href: "/whois", label: "WHOIS Lookup", icon: FileText },
  { href: "/ssl", label: "SSL Checker", icon: Lock },
  { href: "/email-security", label: "Email Security", icon: Mail },
  { href: "/server-status", label: "Server Status", icon: Activity },
  { href: "/bulk", label: "Bulk Check", icon: ClipboardList },
  { href: "/history", label: "Scan History", icon: History },
];

export function SnipeSidebar({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open: boolean) => { if (!open) onClose(); }}
    >
      <SheetContent side="left" className="w-[7.5rem] sm:max-w-[7.5rem] bg-background border-r border-border pt-20 px-2 pb-4">
        <SheetHeader className="px-3 pb-2">
          <SheetTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
            Snipe Tools
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col overflow-y-auto">
          {snipeItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-xs font-medium transition-all duration-200 border overflow-hidden",
                  isActive
                    ? "border-[rgba(99,102,241,0.25)] text-[#a5b4fc]"
                    : "border-transparent text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
                style={isActive ? { background: "rgba(99,102,241,0.15)" } : undefined}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
