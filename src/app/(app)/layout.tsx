import { Sidebar } from "@/components/sidebar";
import { PageTitle } from "@/components/page-title";
import { TopbarActions } from "@/components/topbar-actions";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Sidebar />
      <div className="min-h-screen ml-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <PageTitle />
          <TopbarActions />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </>
  );
}