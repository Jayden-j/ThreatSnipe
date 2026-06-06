import Link from "next/link";
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
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TOOLS = [
  {
    href: "/lookup",
    icon: Search,
    name: "Abuse Checker",
    desc: "IP reputation via AbuseIPDB",
  },
  {
    href: "/domain",
    icon: Globe,
    name: "VirusTotal",
    desc: "Domain & IP malware scan",
  },
  {
    href: "/ports",
    icon: ScanLine,
    name: "Port Scanner",
    desc: "TCP port reconnaissance",
  },
  {
    href: "/blacklist",
    icon: List,
    name: "Blacklist Check",
    desc: "40+ DNSBL provider check",
  },
  {
    href: "/dns",
    icon: Network,
    name: "DNS Records",
    desc: "Full DNS record lookup",
  },
  {
    href: "/whois",
    icon: FileText,
    name: "WHOIS Lookup",
    desc: "Domain registration data",
  },
  {
    href: "/ssl",
    icon: Lock,
    name: "SSL Checker",
    desc: "Certificate validation",
  },
  {
    href: "/email-security",
    icon: Mail,
    name: "Email Security",
    desc: "SPF / DKIM / DMARC audit",
  },
  {
    href: "/server-status",
    icon: Activity,
    name: "Server Status",
    desc: "Comprehensive health check",
  },
  {
    href: "/bulk",
    icon: ClipboardList,
    name: "Bulk Check",
    desc: "Batch up to 20 targets",
  },
];

export function ToolLauncher() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3 pt-4 px-6">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Zap className="h-4 w-4 text-primary" />
          Quick Launch
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col gap-2 rounded-xl border border-border/60 bg-secondary/20 p-3 transition-all duration-200 hover:border-primary/40 hover:bg-secondary/50 hover:shadow-[0_0_20px_-4px_rgba(99,102,241,0.3)] hover:-translate-y-0.5"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 transition-colors duration-200 group-hover:bg-primary/20 group-hover:border-primary/30">
                  <Icon className="h-4 w-4 text-primary" strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground leading-snug">
                    {tool.name}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
                    {tool.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
