"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
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
  ArrowRight,
  Crosshair,
} from "lucide-react";

const CATEGORIES = ["All", "Threat Intel", "Network", "Domain Info", "Email", "Utilities"] as const;
type Category = (typeof CATEGORIES)[number];

const tools = [
  {
    href: "/lookup",
    label: "Abuse Checker",
    icon: Search,
    description: "Query IPs and domains against AbuseIPDB to surface threat and abuse history.",
    category: "Threat Intel" as Category,
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
    category: "Threat Intel" as Category,
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
    category: "Threat Intel" as Category,
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
    category: "Network" as Category,
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
    category: "Network" as Category,
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
    category: "Network" as Category,
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
    category: "Domain Info" as Category,
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
    category: "Domain Info" as Category,
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
    category: "Email" as Category,
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
    category: "Utilities" as Category,
    iconColor: "text-indigo-400",
    iconBg: "rgba(99,102,241,0.12)",
    hoverGlow: "rgba(99,102,241,0.18)",
    borderHover: "rgba(99,102,241,0.3)",
  },
  {
    href: "/history",
    label: "Scan History",
    icon: History,
    description: "Browse, filter, and revisit all your previous threat intelligence scans.",
    category: "Utilities" as Category,
    iconColor: "text-indigo-400",
    iconBg: "rgba(99,102,241,0.12)",
    hoverGlow: "rgba(99,102,241,0.18)",
    borderHover: "rgba(99,102,241,0.3)",
  },
];

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0, 0, 1] } },
};

export default function SnipePage() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");

  const filtered =
    activeCategory === "All"
      ? tools
      : tools.filter((t) => t.category === activeCategory);

  return (
    <div className="relative min-h-screen">
      {/* Page header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              boxShadow: "0 0 20px rgba(99,102,241,0.2)",
            }}
          >
            <Crosshair className="h-5 w-5 text-indigo-400" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold tracking-tight text-foreground leading-tight">
              Snipe Tools
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-body">
              {tools.length} intelligence tools — select one to launch
            </p>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mt-6 h-px w-full"
          style={{
            background:
              "linear-gradient(to right, rgba(99,102,241,0.3), rgba(99,102,241,0.05), transparent)",
          }}
        />
      </div>

      {/* Category filter tabs */}
      <div className="mb-8 -mx-1">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="shrink-0 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 font-body"
                style={{
                  background: isActive
                    ? "rgba(99,102,241,0.18)"
                    : "rgba(255,255,255,0.03)",
                  border: isActive
                    ? "1px solid rgba(99,102,241,0.4)"
                    : "1px solid rgba(255,255,255,0.07)",
                  color: isActive ? "#a5b4fc" : "rgba(255,255,255,0.45)",
                  boxShadow: isActive
                    ? "0 0 12px rgba(99,102,241,0.2)"
                    : "none",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool cards grid */}
      <motion.div
        key={activeCategory}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
      >
        {filtered.map((tool) => {
          const Icon = tool.icon;
          return (
            <motion.div key={tool.href} variants={cardVariants}>
              <ToolCard tool={tool} Icon={Icon} />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

function ToolCard({
  tool,
  Icon,
}: {
  tool: (typeof tools)[number];
  Icon: React.ElementType;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={tool.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative flex flex-col h-full rounded-2xl overflow-hidden transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      style={{
        background: hovered
          ? "rgba(255,255,255,0.055)"
          : "rgba(255,255,255,0.025)",
        border: hovered
          ? `1px solid ${tool.borderHover}`
          : "1px solid rgba(255,255,255,0.07)",
        boxShadow: hovered
          ? `0 0 32px ${tool.hoverGlow}, 0 4px 24px rgba(0,0,0,0.3)`
          : "0 2px 12px rgba(0,0,0,0.2)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Subtle top gradient line */}
      <div
        className="absolute inset-x-0 top-0 h-px transition-opacity duration-300"
        style={{
          background: `linear-gradient(to right, transparent, ${tool.hoverGlow}, transparent)`,
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="flex flex-col h-full p-5 gap-4">
        {/* Icon + category row */}
        <div className="flex items-start justify-between">
          <div
            className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
            style={{
              background: tool.iconBg,
              border: `1px solid ${tool.hoverGlow}`,
              boxShadow: hovered ? `0 0 16px ${tool.hoverGlow}` : "none",
            }}
          >
            <Icon className={`h-5 w-5 ${tool.iconColor}`} strokeWidth={1.75} />
          </div>
          <span
            className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full font-body"
            style={{
              background: tool.iconBg,
              color: tool.iconColor,
              border: `1px solid ${tool.hoverGlow}`,
            }}
          >
            {tool.category}
          </span>
        </div>

        {/* Text content */}
        <div className="flex-1 flex flex-col gap-1.5">
          <h2 className="text-[15px] font-semibold text-foreground font-body leading-snug group-hover:text-white transition-colors duration-200">
            {tool.label}
          </h2>
          <p className="text-[13px] text-muted-foreground font-body leading-relaxed">
            {tool.description}
          </p>
        </div>

        {/* Launch button */}
        <div className="pt-1">
          <div
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold font-body transition-all duration-200"
            style={{ color: hovered ? tool.iconColor : "rgba(255,255,255,0.35)" }}
          >
            Launch tool
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform duration-200"
              style={{ transform: hovered ? "translateX(3px)" : "translateX(0)" }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
