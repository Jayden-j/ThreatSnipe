"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2, Clock, ShieldCheck, Layers, Search, Globe, Building2, FileWarning, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";

function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: "easeOut" as const },
  };
}

const ONBOARDING_STEPS = [
  { icon: Clock,       label: "Up and running in under 60 seconds — no card needed" },
  { icon: Layers,      label: "Monitor up to 25 assets free across IP, domain, and URL" },
  { icon: ShieldCheck, label: "Instant threat scoring from AbuseIPDB, VirusTotal & 20+ feeds" },
];

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "oklch(0.08 0.013 270)" }}>

      {/* ── Left brand panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-12 overflow-hidden">

        {/* Ambient orbs */}
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
          <motion.div
            className="absolute rounded-full"
            style={{
              top: "-10%", left: "-12%", width: 560, height: 560,
              background: "radial-gradient(circle, rgba(139,92,246,0.2) 0%, rgba(139,92,246,0.06) 50%, transparent 75%)",
              filter: "blur(70px)",
            }}
            animate={{ x: [0, 40, -20, 0], y: [0, -25, 20, 0], scale: [1, 1.07, 0.94, 1] }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute rounded-full"
            style={{
              bottom: "-5%", right: "-8%", width: 580, height: 580,
              background: "radial-gradient(circle, rgba(99,102,241,0.16) 0%, rgba(99,102,241,0.04) 50%, transparent 75%)",
              filter: "blur(80px)",
            }}
            animate={{ x: [0, -35, 18, 0], y: [0, 30, -22, 0], scale: [1, 0.95, 1.08, 1] }}
            transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(139,92,246,0.2) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            opacity: 0.22,
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ThreatSnipe%20logo.svg" alt="" width={28} height={28} aria-hidden="true" />
          <span className="text-sm font-semibold tracking-wide" style={{ color: "oklch(0.97 0 0)" }}>
            ThreatSnipe
          </span>
        </div>

        {/* Scan result preview card — replace with /scan-preview.png */}
        <motion.div
          {...fadeUp(0.15)}
          className="relative z-10 my-auto"
          style={{ marginTop: "2rem", marginBottom: "2rem" }}
        >
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: "1px solid rgba(139,92,246,0.2)",
              background: "oklch(0.10 0.012 270)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)",
            }}
          >
            <ScanResultMockup />
          </div>
        </motion.div>

        {/* Hero copy */}
        <div className="relative z-10">
          <motion.p {...fadeUp(0.1)} className="text-xs font-medium uppercase tracking-widest mb-4" style={{ color: "rgba(196,181,253,0.6)" }}>
            Free Forever · No Card Required
          </motion.p>
          <motion.h2 {...fadeUp(0.2)} className="font-display text-4xl xl:text-5xl leading-[1.08] tracking-tight" style={{ color: "oklch(0.97 0 0)" }}>
            Your first scan is
            <br />
            <span className="italic" style={{ color: "#c4b5fd" }}>60 seconds away.</span>
          </motion.h2>

          <motion.div {...fadeUp(0.3)} className="mt-6 flex flex-col gap-3">
            {ONBOARDING_STEPS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-start gap-2.5">
                <div
                  className="mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)" }}
                >
                  <Icon className="h-2.5 w-2.5" style={{ color: "#c4b5fd" }} />
                </div>
                <span className="text-xs leading-snug" style={{ color: "rgba(148,163,184,0.75)" }}>{label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div {...fadeUp(0.4)} className="relative z-10 flex items-center gap-2 text-xs" style={{ color: "rgba(100,116,139,0.6)" }}>
          <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} aria-hidden="true" />
          All systems operational
        </motion.div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        <div
          className="hidden lg:block absolute inset-y-0 left-0 w-px"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(139,92,246,0.25) 30%, rgba(139,92,246,0.25) 70%, transparent)" }}
          aria-hidden="true"
        />

        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-8 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/ThreatSnipe%20logo.svg" alt="" width={26} height={26} aria-hidden="true" />
            <span className="text-sm font-semibold" style={{ color: "oklch(0.97 0 0)" }}>ThreatSnipe</span>
          </motion.div>

          {success ? (
            <motion.div {...fadeUp(0)} className="text-center py-8">
              <div
                className="mx-auto mb-4 h-12 w-12 rounded-full flex items-center justify-center"
                style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}
              >
                <CheckCircle2 className="h-6 w-6" style={{ color: "#4ade80" }} />
              </div>
              <h2 className="font-display text-2xl mb-2" style={{ color: "oklch(0.97 0 0)" }}>Check your inbox</h2>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(148,163,184,0.7)" }}>
                We sent a confirmation link to <span style={{ color: "oklch(0.97 0 0)" }}>{email}</span>.
                <br />Click it to activate your account.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 mt-6 text-sm font-medium transition-colors"
                style={{ color: "#c4b5fd" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#ddd6fe")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#c4b5fd")}
              >
                Back to sign in <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div {...fadeUp(0.05)}>
                <h1 className="font-display text-3xl leading-tight" style={{ color: "oklch(0.97 0 0)" }}>
                  Create your account
                </h1>
                <p className="mt-1.5 text-sm" style={{ color: "rgba(148,163,184,0.7)", fontFamily: "var(--font-body)" }}>
                  Already have one?{" "}
                  <Link
                    href="/login"
                    className="font-medium transition-colors"
                    style={{ color: "#c4b5fd" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ddd6fe")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#c4b5fd")}
                  >
                    Sign in →
                  </Link>
                </p>
              </motion.div>

              {error && (
                <motion.div {...fadeUp(0)} className="mt-5">
                  <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}

              <motion.form {...fadeUp(0.15)} onSubmit={handleRegister} className="mt-7 space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.6)" }}>
                    Email
                  </label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    className="h-11 text-sm"
                    style={{ background: "oklch(0.11 0.010 270)", borderColor: "oklch(0.18 0.006 270)", color: "oklch(0.97 0 0)" }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-password" className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.6)" }}>
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="reg-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="h-11 text-sm pr-10"
                      style={{ background: "oklch(0.11 0.010 270)", borderColor: "oklch(0.18 0.006 270)", color: "oklch(0.97 0 0)" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "rgba(100,116,139,0.6)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(100,116,139,0.6)")}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-confirm" className="text-xs font-medium uppercase tracking-widest" style={{ color: "rgba(148,163,184,0.6)" }}>
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Input
                      id="reg-confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                      required
                      className="h-11 text-sm pr-10"
                      style={{
                        background: "oklch(0.11 0.010 270)",
                        borderColor: confirmPassword && confirmPassword !== password
                          ? "rgba(239,68,68,0.5)"
                          : "oklch(0.18 0.006 270)",
                        color: "oklch(0.97 0 0)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                      style={{ color: "rgba(100,116,139,0.6)" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#c4b5fd")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(100,116,139,0.6)")}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs mt-1" style={{ color: "rgba(239,68,68,0.8)" }}>Passwords don&apos;t match</p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 text-sm font-semibold gap-2 group transition-all duration-200 hover:shadow-[0_0_28px_rgba(139,92,246,0.5)] hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)", color: "white", border: "none" }}
                >
                  {loading ? "Creating account…" : (
                    <>
                      Get Started Free
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </motion.form>

              <motion.p {...fadeUp(0.3)} className="mt-8 text-center text-xs" style={{ color: "rgba(100,116,139,0.5)" }}>
                By creating an account you agree to our{" "}
                <Link href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">Terms</Link>
                {" "}and{" "}
                <Link href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">Privacy Policy</Link>
              </motion.p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ScanResultMockup() {
  const C = {
    bg: "#0f0f1a",
    surface: "#141421",
    border: "rgba(255,255,255,0.06)",
    text: "#f1f5f9",
    muted: "#64748b",
  };
  const score = 87;

  return (
    <div className="select-none pointer-events-none text-[10px] p-3 flex flex-col gap-2" style={{ background: C.bg }}>
      {/* Page heading */}
      <div>
        <p className="font-bold text-[11px]" style={{ color: C.text }}>Abuse Checker</p>
        <p className="text-[8px] mt-0.5" style={{ color: C.muted }}>Check IP/domain reputation via AbuseIPDB</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-1">
        <div className="flex-1 flex items-center gap-1.5 rounded-md px-2 py-1.5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <Search className="h-2.5 w-2.5 shrink-0" style={{ color: C.muted }} />
          <span className="font-mono text-[8px]" style={{ color: C.text }}>185.220.101.45</span>
        </div>
        <div className="rounded-md px-2 py-1 text-[8px] font-medium flex items-center" style={{ background: "rgba(139,92,246,0.85)", color: "white" }}>Lookup</div>
      </div>

      {/* Result card */}
      <div className="rounded-lg overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${C.border}` }}>
          <span className="font-mono text-[11px] font-semibold" style={{ color: C.text }}>185.220.101.45</span>
          <span className="text-[8px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#f87171" }}>MALICIOUS</span>
        </div>

        {/* Score */}
        <div className="px-3 py-2" style={{ borderBottom: `1px solid ${C.border}`, background: "rgba(239,68,68,0.05)" }}>
          <p className="text-[7px] mb-1" style={{ color: C.muted }}>Abuse Confidence Score</p>
          <p className="font-bold text-[18px] leading-none" style={{ color: "#f87171" }}>{score}<span className="text-[10px] font-normal">/100</span></p>
          <div className="mt-1.5 h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
            <div className="h-full rounded-full" style={{ width: `${score}%`, background: "#ef4444" }} />
          </div>
          <p className="text-[7px] mt-1" style={{ color: C.muted }}>Based on 1,247 reports</p>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-1.5 p-2">
          {[
            { icon: Globe,       label: "Country",       val: "🇷🇺 Russia" },
            { icon: Building2,   label: "ISP",           val: "AS200651 Serverius" },
            { icon: FileWarning, label: "Total Reports", val: "1,247" },
            { icon: Calendar,    label: "Last Reported", val: "Jun 10, 2025" },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="flex items-center gap-1.5 rounded-md p-1.5" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}` }}>
              <Icon className="h-2.5 w-2.5 shrink-0" style={{ color: C.muted }} />
              <div className="min-w-0">
                <p className="text-[7px]" style={{ color: C.muted }}>{label}</p>
                <p className="text-[8px] font-medium truncate" style={{ color: C.text }}>{val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
