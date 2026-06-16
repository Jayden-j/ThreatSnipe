"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

interface Stat {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  description: string;
}

const STATS: Stat[] = [
  {
    value: 500,
    suffix: "K+",
    label: "IPs analyzed",
    description: "Unique IP addresses scanned and threat-scored across all users.",
  },
  {
    value: 99.9,
    suffix: "%",
    label: "Platform uptime",
    description: "Guaranteed availability with redundant infrastructure and active monitoring.",
  },
  {
    value: 20,
    suffix: "+",
    label: "Blacklist providers",
    description: "DNSBL providers checked simultaneously for every scan you run.",
  },
  {
    value: 500,
    suffix: "ms",
    prefix: "<",
    label: "Scan response time",
    description: "Average time from scan request to full threat report delivery.",
  },
];

function useCountUp(target: number, duration = 1800) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLElement | null>(null);
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: "-60px" });
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;

    if (prefersReduced) {
      setCount(target);
      return;
    }

    let startTs: number | null = null;
    const isDecimal = target % 1 !== 0;

    const animate = (ts: number) => {
      if (!startTs) startTs = ts;
      const elapsed = ts - startTs;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      const current = eased * target;
      setCount(isDecimal ? Math.round(current * 10) / 10 : Math.round(current));
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [isInView, target, duration, prefersReduced]);

  return { count, ref };
}

function StatNumber({ stat }: { stat: Stat }) {
  const { count, ref } = useCountUp(stat.value);
  const displayValue = stat.value % 1 !== 0 ? count.toFixed(1) : count.toLocaleString();

  return (
    <span
      ref={ref as React.RefObject<HTMLSpanElement>}
      className="font-display text-5xl md:text-6xl text-white leading-none tabular-nums"
    >
      {stat.prefix && <span>{stat.prefix}</span>}
      {displayValue}
      <span style={{ color: "#818cf8" }}>{stat.suffix}</span>
    </span>
  );
}

export function StatsSection() {
  return (
    <section
      id="stats"
      className="relative py-24 md:py-32 px-6"
      style={{ scrollMarginTop: "4rem" }}
    >
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% 50%, rgba(99,102,241,0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
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
            By the numbers
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-white leading-tight">
            Built to scale with{" "}
            <span className="italic" style={{ color: "#a5b4fc" }}>
              your security posture.
            </span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.5,
                delay: i * 0.1,
                ease: "easeOut",
              }}
              className="flex flex-col items-center text-center p-8 md:p-10"
              style={{ background: "#1c1c2e" }}
            >
              <StatNumber stat={stat} />
              <p className="mt-2 text-sm font-semibold text-white font-body">{stat.label}</p>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed font-body max-w-[180px]">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
