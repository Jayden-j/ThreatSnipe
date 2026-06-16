"use client";

import { motion } from "framer-motion";
import {
  Shield,
  Globe,
  Network,
  ListChecks,
  BellRing,
  LayoutDashboard,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  glowColor: string;
  iconColor: string;
  borderGlow: string;
}

const FEATURES: Feature[] = [
  {
    icon: Shield,
    title: "IP Intelligence",
    description:
      "Cross-reference any IP against AbuseIPDB's database of 60M+ abuse reports. Get confidence scores, geolocation, ISP data, and usage type in milliseconds.",
    glowColor: "rgba(99,102,241,0.15)",
    iconColor: "#818cf8",
    borderGlow: "rgba(99,102,241,0.3)",
  },
  {
    icon: Globe,
    title: "Domain Analysis",
    description:
      "WHOIS lookup, DNS record inspection, and VirusTotal reputation checks consolidated into a single actionable threat report — no tab-switching required.",
    glowColor: "rgba(139,92,246,0.15)",
    iconColor: "#a78bfa",
    borderGlow: "rgba(139,92,246,0.3)",
  },
  {
    icon: Network,
    title: "CIDR Range Scanning",
    description:
      "Scan entire subnets from /8 to /32 and get aggregate threat intelligence. Identify compromised hosts inside your network ranges in one pass.",
    glowColor: "rgba(59,130,246,0.15)",
    iconColor: "#60a5fa",
    borderGlow: "rgba(59,130,246,0.3)",
  },
  {
    icon: ListChecks,
    title: "DNSBL Blacklists",
    description:
      "Simultaneously verify against 20+ DNS blacklist providers. Know within seconds if any of your IPs appear on a major spam or abuse list.",
    glowColor: "rgba(239,68,68,0.12)",
    iconColor: "#f87171",
    borderGlow: "rgba(239,68,68,0.25)",
  },
  {
    icon: BellRing,
    title: "Real-time Alerts",
    description:
      "Configure threshold-based alerts and get notified the moment a monitored asset's threat level changes or surfaces on a new blacklist provider.",
    glowColor: "rgba(245,158,11,0.12)",
    iconColor: "#fbbf24",
    borderGlow: "rgba(245,158,11,0.25)",
  },
  {
    icon: LayoutDashboard,
    title: "Unified Dashboard",
    description:
      "All your threat data consolidated into one clean interface. Track asset health trends over time with visual charts and one-click exportable reports.",
    glowColor: "rgba(16,185,129,0.12)",
    iconColor: "#34d399",
    borderGlow: "rgba(16,185,129,0.25)",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-24 md:py-32 px-6"
      style={{ scrollMarginTop: "4rem" }}
    >
      {/* Section glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.07) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4 font-body"
            style={{ color: "#818cf8" }}
          >
            Capabilities
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            Everything you need to stay{" "}
            <span className="italic" style={{ color: "#a5b4fc" }}>
              ahead of threats.
            </span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-base leading-relaxed font-body">
            ThreatSnipe brings together the industry&apos;s most trusted threat data
            sources into one unified platform — without the enterprise price tag.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const Icon = feature.icon;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative rounded-2xl p-6 cursor-default transition-all duration-300"
      style={{
        background: "#1c1c2e",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Hover border glow */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          border: `1px solid ${feature.borderGlow}`,
        }}
        aria-hidden="true"
      />

      {/* Icon */}
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:shadow-[0_0_20px_var(--glow)]"
        style={
          {
            background: feature.glowColor,
            border: `1px solid ${feature.borderGlow}`,
            "--glow": feature.glowColor,
          } as React.CSSProperties
        }
      >
        <Icon className="h-5 w-5" style={{ color: feature.iconColor }} strokeWidth={1.8} />
      </div>

      {/* Content */}
      <h3 className="text-base font-semibold text-white mb-2 font-body">
        {feature.title}
      </h3>
      <p className="text-sm text-slate-400 leading-relaxed font-body">
        {feature.description}
      </p>
    </motion.div>
  );
}
