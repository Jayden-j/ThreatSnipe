"use client";

import { usePathname } from "next/navigation";

const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/lookup": "IP Lookup",
  "/domain": "Domain Lookup",
  "/ports": "Port Scanner",
  "/history": "Scan History",
  "/alerts": "Alerts",
  "/settings": "Settings",
};

export function PageTitle() {
  const pathname = usePathname();
  const title = routeTitles[pathname] ?? "Dashboard";

  return (
    <h1 className="text-sm font-semibold text-foreground">{title}</h1>
  );
}