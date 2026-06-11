"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Crosshair, LayoutDashboard, FolderKanban } from "lucide-react";
import { NavBar } from "@/components/ui/tubelight-navbar";
import { AlertBell } from "@/components/alert-bell";
import { AccountDropdown } from "@/components/account-dropdown";

const navItems = [
  { name: "Snipe",     url: "/snipe",      icon: Crosshair       },
  { name: "Dashboard", url: "/dashboard",  icon: LayoutDashboard },
  { name: "Assets",    url: "/assets",     icon: FolderKanban    },
];

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  return (
    <div className="bg-background text-foreground">
      {/* Dot grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      {/* Animated ambient orbs */}
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute rounded-full"
          style={{
            top: "-15%",
            right: "-10%",
            width: 700,
            height: 700,
            background:
              "radial-gradient(circle, rgba(99,102,241,0.09) 0%, rgba(99,102,241,0.03) 50%, transparent 70%)",
            filter: "blur(60px)",
            animation: "orb-drift-a 22s ease-in-out infinite, orb-pulse 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            bottom: "0%",
            left: "-5%",
            width: 520,
            height: 520,
            background:
              "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
            filter: "blur(80px)",
            animation: "orb-drift-b 28s ease-in-out infinite, orb-pulse 11s ease-in-out infinite 3s",
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            top: "45%",
            right: "25%",
            width: 300,
            height: 300,
            background:
              "radial-gradient(circle, rgba(56,189,248,0.04) 0%, transparent 70%)",
            filter: "blur(50px)",
            animation: "orb-drift-b 35s ease-in-out infinite 6s",
          }}
        />

        {/* Sparkle stars */}
        {([
          { top: "12%", left: "22%", d: "4.2s", delay: "0s"   },
          { top: "38%", left: "67%", d: "3.8s", delay: "1.4s" },
          { top: "62%", left: "15%", d: "5.1s", delay: "0.7s" },
          { top: "20%", left: "80%", d: "3.3s", delay: "2.1s" },
          { top: "75%", left: "50%", d: "4.6s", delay: "0.3s" },
          { top: "50%", left: "38%", d: "3.6s", delay: "1.9s" },
          { top: "85%", left: "72%", d: "5.4s", delay: "0.9s" },
          { top: "8%",  left: "55%", d: "4.0s", delay: "3.0s" },
        ] as const).map((s, i) => (
          <div
            key={i}
            className="absolute h-[2px] w-[2px] rounded-full bg-white/60"
            style={{
              top: s.top,
              left: s.left,
              animation: `star-twinkle ${s.d} ease-in-out infinite`,
              animationDelay: s.delay,
            }}
          />
        ))}
      </div>

      {/* Main content area */}
      <div className="relative min-h-screen">
        {/* Floating pill navbar */}
        <NavBar items={navItems} />

        {/* Right-side controls */}
        <div className="fixed top-0 right-0 z-50 flex items-center gap-2 pt-[1.625rem] pr-6">
          <AlertBell />
          <AccountDropdown />
        </div>

        <motion.main
          key={pathname}
          className="p-6 pt-24 pb-28 sm:pb-6"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
