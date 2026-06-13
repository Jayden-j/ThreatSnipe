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
  type LucideIcon,
} from "lucide-react";

export const CATEGORIES = ["All", "Threat Intel", "Network", "Domain Info", "Email", "Utilities"] as const;
export type Category = (typeof CATEGORIES)[number];

export interface ToolDef {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
  category: Category;
  iconColor: string;
  iconBg: string;
  hoverGlow: string;
  borderHover: string;
}

export const TOOLS: ToolDef[] = [
  {
    href: "/lookup",
    label: "Abuse Checker",
    icon: Search,
    description: "Query IPs and domains against AbuseIPDB to surface threat and abuse history.",
    category: "Threat Intel",
    iconColor: "text-red-400",
    iconBg: "rgba(239,68,68,0.12)",
    hoverGlow: "rgba(239,68,68,0.18)",
    borderHover: "rgba(239,68,68,0.3)",
  },
  {
    href: "/domain",
    label: "VirusTotal Check",
    icon: Globe,
    description: "Scan URLs, domains, and files through 70+ antivirus and security engines.",
    category: "Threat Intel",
    iconColor: "text-orange-400",
    iconBg: "rgba(251,146,60,0.12)",
    hoverGlow: "rgba(251,146,60,0.18)",
    borderHover: "rgba(251,146,60,0.3)",
  },
  {
    href: "/blacklist",
    label: "Blacklist Check",
    icon: List,
    description: "Verify if an IP or domain appears on major threat blacklists and blocklists.",
    category: "Threat Intel",
    iconColor: "text-rose-400",
    iconBg: "rgba(251,113,133,0.12)",
    hoverGlow: "rgba(251,113,133,0.18)",
    borderHover: "rgba(251,113,133,0.3)",
  },
  {
    href: "/ports",
    label: "Port Scanner",
    icon: ScanLine,
    description: "Discover open ports and identify running services on any host.",
    category: "Network",
    iconColor: "text-sky-400",
    iconBg: "rgba(56,189,248,0.12)",
    hoverGlow: "rgba(56,189,248,0.18)",
    borderHover: "rgba(56,189,248,0.3)",
  },
  {
    href: "/dns",
    label: "DNS Records",
    icon: Network,
    description: "Inspect full DNS record sets — A, AAAA, MX, TXT, CNAME, and more.",
    category: "Network",
    iconColor: "text-sky-400",
    iconBg: "rgba(56,189,248,0.12)",
    hoverGlow: "rgba(56,189,248,0.18)",
    borderHover: "rgba(56,189,248,0.3)",
  },
  {
    href: "/server-status",
    label: "Server Status",
    icon: Activity,
    description: "Check HTTP response status and latency for any web server or endpoint.",
    category: "Network",
    iconColor: "text-cyan-400",
    iconBg: "rgba(34,211,238,0.12)",
    hoverGlow: "rgba(34,211,238,0.18)",
    borderHover: "rgba(34,211,238,0.3)",
  },
  {
    href: "/whois",
    label: "WHOIS Lookup",
    icon: FileText,
    description: "Retrieve domain registration details, registrar, and ownership records.",
    category: "Domain Info",
    iconColor: "text-emerald-400",
    iconBg: "rgba(52,211,153,0.12)",
    hoverGlow: "rgba(52,211,153,0.18)",
    borderHover: "rgba(52,211,153,0.3)",
  },
  {
    href: "/ssl",
    label: "SSL Checker",
    icon: Lock,
    description: "Analyze SSL/TLS certificates for validity, chain issues, and configuration.",
    category: "Domain Info",
    iconColor: "text-teal-400",
    iconBg: "rgba(45,212,191,0.12)",
    hoverGlow: "rgba(45,212,191,0.18)",
    borderHover: "rgba(45,212,191,0.3)",
  },
  {
    href: "/email-security",
    label: "Email Security",
    icon: Mail,
    description: "Audit SPF, DKIM, and DMARC records to harden your email authentication.",
    category: "Email",
    iconColor: "text-violet-400",
    iconBg: "rgba(139,92,246,0.12)",
    hoverGlow: "rgba(139,92,246,0.18)",
    borderHover: "rgba(139,92,246,0.3)",
  },
  {
    href: "/bulk",
    label: "Bulk Check",
    icon: ClipboardList,
    description: "Run threat intelligence checks against multiple targets simultaneously.",
    category: "Utilities",
    iconColor: "text-indigo-400",
    iconBg: "rgba(99,102,241,0.12)",
    hoverGlow: "rgba(99,102,241,0.18)",
    borderHover: "rgba(99,102,241,0.3)",
  },
];
