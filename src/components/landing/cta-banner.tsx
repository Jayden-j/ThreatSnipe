"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Shield } from "lucide-react";

export function CtaBanner() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative py-24 md:py-32 px-6 overflow-hidden">
      {/* Background gradient card */}
      <motion.div
        initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.96 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative max-w-4xl mx-auto rounded-3xl overflow-hidden p-px"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.5) 0%, rgba(139,92,246,0.3) 50%, rgba(99,102,241,0.2) 100%)",
        }}
      >
        <div
          className="relative rounded-3xl px-8 py-16 md:px-16 md:py-20 text-center overflow-hidden"
          style={{ background: "linear-gradient(135deg, #13132a 0%, #0f0f20 100%)" }}
        >
          {/* Inner glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 50% 0%, rgba(99,102,241,0.2) 0%, transparent 65%)",
            }}
            aria-hidden="true"
          />
          {/* Corner orbs */}
          <div
            className="absolute -top-20 -left-20 h-64 w-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full pointer-events-none"
            style={{
              background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
              filter: "blur(40px)",
            }}
            aria-hidden="true"
          />

          <div className="relative z-10">
            {/* Icon */}
            <div
              className="mx-auto mb-6 h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(99,102,241,0.2)",
                border: "1px solid rgba(99,102,241,0.4)",
                boxShadow: "0 0 32px rgba(99,102,241,0.3)",
              }}
            >
              <Shield className="h-7 w-7 text-indigo-400" strokeWidth={1.8} />
            </div>

            {/* Headline */}
            <h2 className="font-display text-4xl md:text-5xl text-white leading-tight mb-4">
              Ready to secure your{" "}
              <span className="italic" style={{ color: "#a5b4fc" }}>
                network perimeter?
              </span>
            </h2>

            <p className="text-slate-400 text-base max-w-lg mx-auto leading-relaxed font-body mb-10">
              Join security teams who use ThreatSnipe to stay ahead of threats. Start for free —
              no credit card required, no time limit on the free tier.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group inline-flex items-center gap-2.5 text-sm font-semibold px-7 py-3.5 rounded-full font-body transition-all duration-200 hover:shadow-[0_0_40px_rgba(99,102,241,0.65)] hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                  color: "white",
                }}
              >
                Start Monitoring Free
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors font-body"
              >
                Already have an account? Sign in
              </Link>
            </div>

            {/* Trust line */}
            <p className="mt-8 text-xs text-slate-600 font-body">
              Free tier · No credit card · Instant access · Deploy in 60 seconds
            </p>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
