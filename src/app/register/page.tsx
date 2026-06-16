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

const GitHubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12.001 2C6.47598 2 2.00098 6.475 2.00098 12C2.00098 16.425 4.86348 20.1625 8.83848 21.4875C9.33848 21.575 9.52598 21.275 9.52598 21.0125C9.52598 20.775 9.51348 19.9875 9.51348 19.15C7.00098 19.6125 6.35098 18.5375 6.15098 17.975C6.03848 17.6875 5.55098 16.8 5.12598 16.5625C4.77598 16.375 4.27598 15.9125 5.11348 15.9C5.90098 15.8875 6.46348 16.625 6.65098 16.925C7.55098 18.4375 8.98848 18.0125 9.56348 17.75C9.65098 17.1 9.91348 16.6625 10.201 16.4125C7.97598 16.1625 5.65098 15.3 5.65098 11.475C5.65098 10.3875 6.03848 9.4875 6.67598 8.7875C6.57598 8.5375 6.22598 7.5125 6.77598 6.1375C6.77598 6.1375 7.61348 5.875 9.52598 7.1625C10.326 6.9375 11.176 6.825 12.026 6.825C12.876 6.825 13.726 6.9375 14.526 7.1625C16.4385 5.8625 17.276 6.1375 17.276 6.1375C17.826 7.5125 17.476 8.5375 17.376 8.7875C18.0135 9.4875 18.401 10.375 18.401 11.475C18.401 15.3125 16.0635 16.1625 13.8385 16.4125C14.201 16.725 14.5135 17.325 14.5135 18.2625C14.5135 19.6 14.501 20.675 14.501 21.0125C14.501 21.275 14.6885 21.5875 15.1885 21.4875C19.259 20.1133 21.9999 16.2963 22.001 12C22.001 6.475 17.526 2 12.001 2Z" />
  </svg>
);

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M3.06364 7.50914C4.70909 4.24092 8.09084 2 12 2C14.6954 2 16.959 2.99095 18.6909 4.60455L15.8227 7.47274C14.7864 6.48185 13.4681 5.97727 12 5.97727C9.39542 5.97727 7.19084 7.73637 6.40455 10.1C6.2045 10.7 6.09086 11.3409 6.09086 12C6.09086 12.6591 6.2045 13.3 6.40455 13.9C7.19084 16.2636 9.39542 18.0227 12 18.0227C13.3454 18.0227 14.4909 17.6682 15.3864 17.0682C16.4454 16.3591 17.15 15.3 17.3818 14.05H12V10.1818H21.4181C21.5364 10.8363 21.6 11.5182 21.6 12.2273C21.6 15.2727 20.5091 17.8363 18.6181 19.5773C16.9636 21.1046 14.7 22 12 22C8.09084 22 4.70909 19.7591 3.06364 16.4909C2.38638 15.1409 2 13.6136 2 12C2 10.3864 2.38638 8.85911 3.06364 7.50914Z" />
  </svg>
);

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

  const handleOAuth = async (provider: "github" | "google") => {
    setError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };

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
          <img src="/ThreatSnipe%20logo.jpg" alt="" width={40} height={40} aria-hidden="true" />
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
            <img src="/ThreatSnipe%20logo.jpg" alt="" width={36} height={36} aria-hidden="true" />
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

              {/* OAuth */}
              <motion.div {...fadeUp(0.15)} className="mt-7 grid grid-cols-2 gap-3">
                {(["github", "google"] as const).map((provider) => (
                  <button
                    key={provider}
                    onClick={() => handleOAuth(provider)}
                    className="flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-medium transition-all duration-200"
                    style={{ background: "oklch(0.11 0.010 270)", border: "1px solid oklch(0.18 0.006 270)", color: "oklch(0.97 0 0)" }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.15 0.008 270)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(139,92,246,0.4)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.11 0.010 270)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "oklch(0.18 0.006 270)";
                    }}
                  >
                    {provider === "github" ? <GitHubIcon className="h-4 w-4" aria-hidden="true" /> : <GoogleIcon className="h-4 w-4" aria-hidden="true" />}
                    {provider === "github" ? "GitHub" : "Google"}
                  </button>
                ))}
              </motion.div>

              {/* Divider */}
              <motion.div {...fadeUp(0.2)} className="relative my-6">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full" style={{ borderTop: "1px solid oklch(0.18 0.006 270)" }} />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 text-xs uppercase tracking-widest" style={{ background: "oklch(0.08 0.013 270)", color: "rgba(100,116,139,0.6)" }}>
                    or continue with email
                  </span>
                </div>
              </motion.div>

              <motion.form {...fadeUp(0.25)} onSubmit={handleRegister} className="space-y-4">
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
    bg: "#181826",
    surface: "#1c1c2e",
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
