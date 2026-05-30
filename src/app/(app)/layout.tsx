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
    <>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="min-h-screen ml-0 lg:ml-60">
        <header className="sticky top-0 z-30 grid h-14 grid-cols-[1fr_auto_1fr] items-center border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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
    </>
  );
}