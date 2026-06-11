"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ArrowRight, Eye, EyeOff } from "lucide-react";
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

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: "oklch(0.08 0.013 270)" }}
    >
      {/* Orb background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        <motion.div
          className="absolute rounded-full"
          style={{
            top: "-10%",
            right: "-5%",
            width: 600,
            height: 600,
            background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, rgba(99,102,241,0.05) 50%, transparent 75%)",
            filter: "blur(60px)",
          }}
          animate={{ x: [0, 30, -15, 0], y: [0, -20, 15, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{
            bottom: "5%",
            left: "-8%",
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.04) 50%, transparent 75%)",
            filter: "blur(80px)",
          }}
          animate={{ x: [0, -25, 18, 0], y: [0, 20, -25, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        {/* Logo */}
        <motion.div {...fadeUp(0)} className="flex items-center gap-2 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ThreatSnipe%20logo.svg" alt="" width={26} height={26} aria-hidden="true" />
          <span className="text-sm font-semibold" style={{ color: "oklch(0.97 0 0)" }}>
            ThreatSnipe
          </span>
        </motion.div>

        <motion.div {...fadeUp(0.05)}>
          <h1
            className="font-display text-3xl leading-tight"
            style={{ color: "oklch(0.97 0 0)" }}
          >
            Create your{" "}
            <span className="italic" style={{ color: "#a5b4fc" }}>account</span>
          </h1>
          <p className="mt-2 text-sm" style={{ color: "rgba(148,163,184,0.7)", fontFamily: "var(--font-body)" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium transition-colors"
              style={{ color: "#818cf8" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#818cf8")}
            >
              Sign in
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

        {success ? (
          <motion.div {...fadeUp(0)} className="mt-6">
            <Alert className="border-emerald-500/30 bg-emerald-500/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-400">
                Check your email to confirm your account.
              </AlertDescription>
            </Alert>
            <p className="mt-4 text-center text-sm" style={{ color: "rgba(148,163,184,0.6)" }}>
              <Link
                href="/login"
                className="font-medium transition-colors"
                style={{ color: "#818cf8" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#a5b4fc")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#818cf8")}
              >
                Back to sign in
              </Link>
            </p>
          </motion.div>
        ) : (
          <motion.form
            {...fadeUp(0.15)}
            onSubmit={handleRegister}
            className="mt-7 space-y-4"
          >
            <div className="space-y-1.5">
              <label
                htmlFor="reg-email"
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "rgba(148,163,184,0.6)" }}
              >
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
                style={{
                  background: "oklch(0.11 0.010 270)",
                  borderColor: "oklch(0.18 0.006 270)",
                  color: "oklch(0.97 0 0)",
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-password"
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "rgba(148,163,184,0.6)" }}
              >
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
                  style={{
                    background: "oklch(0.11 0.010 270)",
                    borderColor: "oklch(0.18 0.006 270)",
                    color: "oklch(0.97 0 0)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(100,116,139,0.6)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#818cf8")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(100,116,139,0.6)")}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="reg-confirm"
                className="text-xs font-medium uppercase tracking-widest"
                style={{ color: "rgba(148,163,184,0.6)" }}
              >
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
                    borderColor: "oklch(0.18 0.006 270)",
                    color: "oklch(0.97 0 0)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(100,116,139,0.6)" }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#818cf8")}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "rgba(100,116,139,0.6)")}
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-sm font-semibold gap-2 group transition-all duration-200 hover:shadow-[0_0_28px_rgba(99,102,241,0.5)] hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                color: "white",
                border: "none",
              }}
            >
              {loading ? (
                "Creating account…"
              ) : (
                <>
                  Create Account
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </Button>
          </motion.form>
        )}

        <motion.p
          {...fadeUp(0.3)}
          className="mt-8 text-center text-xs"
          style={{ color: "rgba(100,116,139,0.5)" }}
        >
          By registering you agree to our{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="#" className="underline underline-offset-2 hover:text-slate-400 transition-colors">
            Privacy Policy
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
