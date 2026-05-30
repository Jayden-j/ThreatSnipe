"use client";

import { usePathname } from "next/navigation";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/lookup": "IP Lookup",
  "/domain": "Domain Lookup",
  "/ports": "Port Scanner",
  "/blacklist": "Blacklist Check",
  "/dns": "DNS Records",
  "/whois": "WHOIS Lookup",
  "/history": "Scan History",
  "/alerts": "Alerts",
  "/settings": "Settings",
  "/ssl": "SSL Certificate Checker",
  "/email-security": "Email Security",
  "/server-status": "Server Status",
  "/bulk": "Bulk Check",
};

export function PageTitle() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Dashboard";

  return (
    <h1 className="text-sm font-semibold text-foreground">{title}</h1>
  );
}