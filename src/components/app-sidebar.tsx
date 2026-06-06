"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const snipeItems = [
  { href: "/lookup",         label: "Abuse Checker",   icon: Search       },
  { href: "/domain",         label: "VirusTotal Check",icon: Globe        },
  { href: "/ports",          label: "Port Scanner",    icon: ScanLine     },
  { href: "/blacklist",      label: "Blacklist Check", icon: List         },
  { href: "/dns",            label: "DNS Records",     icon: Network      },
  { href: "/whois",          label: "WHOIS Lookup",    icon: FileText     },
  { href: "/ssl",            label: "SSL Checker",     icon: Lock         },
  { href: "/email-security", label: "Email Security",  icon: Mail         },
  { href: "/server-status",  label: "Server Status",   icon: Activity     },
  { href: "/bulk",           label: "Bulk Check",      icon: ClipboardList},
  { href: "/history",        label: "Scan History",    icon: History      },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpen } = useSidebar();

  return (
    <Sidebar collapsible="offcanvas">
      {/* Spacer so content clears the floating navbar */}
      <SidebarHeader className="pt-20 px-4 pb-2 border-b border-sidebar-border">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
          Snipe Tools
        </p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {snipeItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={pathname === item.href}
                    render={<Link href={item.href} onClick={() => setOpen(false)} />}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
