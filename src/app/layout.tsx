  import type { Metadata } from "next";
  import { Antic } from "next/font/google";
  import { JetBrains_Mono } from "next/font/google";
  import "./globals.css";
  import { Sidebar } from "@/components/sidebar";
  import { PageTitle } from "@/components/page-title";
  import { TopbarActions } from "@/components/topbar-actions";

  const antic = Antic({ 
    weight: '400',
    subsets: ['latin'],
    variable: '--font-sans'
  })

  const jetbrainsMono = JetBrains_Mono({ 
    subsets: ['latin'],
    variable: '--font-mono'
  })

  export const metadata: Metadata = {
    title: "Centry — Cyber Threat Monitor",
    description: "Cybersecurity threat monitoring dashboard",
  };

  export default function RootLayout({children,}: Readonly<{
    children: React.ReactNode;
  }>) {
    return (
      <html
  lang="en"
  className={`${antic.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
>
        <body className="min-h-full bg-background text-foreground">
          <Sidebar />
          <div className="min-h-screen ml-60">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <PageTitle />
              <TopbarActions />
            </header>
            <main className="p-6">{children}</main>
          </div>
        </body>
      </html>
    );
  }
