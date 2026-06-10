"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Stats", href: "#stats" },
];

export function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(11,11,20,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(24px) saturate(180%)" : "none",
        borderBottom: `1px solid ${scrolled ? "rgba(255,255,255,0.07)" : "transparent"}`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group" aria-label="ThreatSnipe home">
            <img
              src="/ThreatSnipe logo.svg"
              alt="ThreatSnipe logo"
              width={32}
              height={32}
              className="h-8 w-8 object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]"
              style={{ filter: "brightness(0) invert(1)" }}
            />
            <span className="font-semibold text-white tracking-tight text-[15px] font-body">
              ThreatSnipe
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-slate-400 hover:text-white transition-colors duration-200 font-body"
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-slate-400 hover:text-white transition-colors font-body"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium px-5 py-2 rounded-full font-body transition-all duration-200 hover:shadow-[0_0_28px_rgba(99,102,241,0.55)] hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                color: "white",
              }}
            >
              Get Started Free
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden text-slate-400 hover:text-white transition-colors p-1 rounded"
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            key="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="md:hidden overflow-hidden"
            style={{
              background: "rgba(11,11,20,0.97)",
              borderTop: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="px-6 py-5 flex flex-col gap-1">
              {NAV_LINKS.map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  className="text-sm text-slate-400 hover:text-white transition-colors py-2.5 font-body"
                  onClick={() => setOpen(false)}
                >
                  {label}
                </Link>
              ))}
              <div className="my-2 border-t border-white/5" />
              <Link
                href="/login"
                className="text-sm text-slate-400 hover:text-white transition-colors py-2.5 font-body"
                onClick={() => setOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="mt-1 text-sm font-medium text-center px-5 py-3 rounded-full font-body hover:brightness-110 transition-all"
                style={{
                  background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                  color: "white",
                }}
                onClick={() => setOpen(false)}
              >
                Get Started Free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
