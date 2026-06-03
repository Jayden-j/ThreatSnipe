"use client";

import { useState } from "react";
import { Sidebar } from "@/components/sidebar";
import { PageTitle } from "@/components/page-title";
import { TopbarActions } from "@/components/topbar-actions";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="dark bg-background text-foreground">
      {/* Subtle dot grid overlay — matches landing page atmosphere */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
        aria-hidden="true"
      />

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="relative z-10 min-h-screen ml-0 lg:ml-60">
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background/80 px-6 backdrop-blur-md">
          <div />
          <PageTitle />
          <div className="flex justify-end">
            <TopbarActions
              onMenuClick={() => setIsSidebarOpen((prev) => !prev)}
            />
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}