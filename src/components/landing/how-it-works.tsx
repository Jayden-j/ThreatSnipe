"use client";

import { motion } from "framer-motion";
import { PackagePlus, SlidersHorizontal, ShieldAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Step {
  number: string;
  icon: LucideIcon;
  iconColor: string;
  glowColor: string;
  title: string;
  description: string;
  detail: string[];
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: PackagePlus,
    iconColor: "#818cf8",
    glowColor: "rgba(99,102,241,0.2)",
    title: "Add your assets",
    description:
      "Import the IPs, domains, or CIDR ranges you want to monitor. Paste them manually, upload a CSV, or connect your cloud inventory.",
    detail: ["Single IPs & ranges", "Domain names", "CIDR subnets /8–/32"],
  },
  {
    number: "02",
    icon: SlidersHorizontal,
    iconColor: "#a78bfa",
    glowColor: "rgba(139,92,246,0.2)",
    title: "Configure monitors",
    description:
      "Set scan frequency, alert thresholds, and notification channels. Choose which intelligence providers matter most to your threat model.",
    detail: ["Hourly, daily, or on-demand scans", "Configurable risk thresholds", "Email & webhook alerts"],
  },
  {
    number: "03",
    icon: ShieldAlert,
    iconColor: "#34d399",
    glowColor: "rgba(16,185,129,0.2)",
    title: "Stay protected",
    description:
      "Receive real-time alerts when threat levels change or assets appear on new blacklists. Track trends and export reports for your team.",
    detail: ["Instant threat notifications", "Historical trend charts", "PDF & CSV report export"],
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative py-24 md:py-32 px-6"
      style={{ scrollMarginTop: "4rem" }}
    >
      {/* Subtle section bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "rgba(255,255,255,0.013)" }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center mb-20"
        >
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-4 font-body"
            style={{ color: "#818cf8" }}
          >
            How it works
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            Up and running in{" "}
            <span className="italic" style={{ color: "#a5b4fc" }}>
              under five minutes.
            </span>
          </h2>
          <p className="mt-4 text-slate-400 max-w-xl mx-auto text-base leading-relaxed font-body">
            No complex configuration. No steep learning curve. Just point ThreatSnipe at
            your assets and let the platform do the rest.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {/* Connector line — desktop only */}
          <div
            className="hidden md:block absolute top-[2.75rem] left-[calc(33.33%_+_1.5rem)] right-[calc(33.33%_+_1.5rem)] h-px pointer-events-none"
            style={{
              background:
                "linear-gradient(to right, rgba(99,102,241,0.5), rgba(139,92,246,0.5))",
            }}
            aria-hidden="true"
          />

          {STEPS.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.55,
        delay: index * 0.12,
        ease: "easeOut",
      }}
      className="flex flex-col"
    >
      {/* Step number + icon */}
      <div className="flex items-center gap-4 mb-5">
        <div className="relative">
          <div
            className="h-11 w-11 rounded-full flex items-center justify-center"
            style={{
              background: step.glowColor,
              border: `1px solid ${step.glowColor.replace("0.2)", "0.5)")}`,
              boxShadow: `0 0 24px ${step.glowColor}`,
            }}
          >
            <Icon className="h-5 w-5" style={{ color: step.iconColor }} strokeWidth={1.8} />
          </div>
          {/* Step number badge */}
          <span
            className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold font-mono"
            style={{
              background: "#0b0b14",
              border: `1px solid ${step.glowColor.replace("0.2)", "0.6)")}`,
              color: step.iconColor,
            }}
          >
            {index + 1}
          </span>
        </div>

        {/* Connector — mobile only, shown between steps */}
        {index < 2 && (
          <div
            className="md:hidden flex-1 h-px"
            style={{ background: "rgba(99,102,241,0.3)" }}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Text */}
      <h3 className="text-lg font-semibold text-white mb-2 font-body">{step.title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed font-body mb-4">
        {step.description}
      </p>

      {/* Detail bullets */}
      <ul className="flex flex-col gap-2" aria-label={`${step.title} details`}>
        {step.detail.map((item) => (
          <li key={item} className="flex items-center gap-2 text-xs text-slate-500 font-body">
            <span
              className="h-1 w-1 rounded-full shrink-0"
              style={{ background: step.iconColor }}
              aria-hidden="true"
            />
            {item}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
