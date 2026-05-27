  import type { Metadata } from "next";
  import { Antic } from "next/font/google";
  import { JetBrains_Mono } from "next/font/google";
  import "./globals.css";
  import { Sidebar } from "@/components/sidebar";
  import { Shield } from "lucide-react";

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
          <div className="min-h-screen pl-60">
            <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">
                Centry
              </span>
            </header>
            <main className="p-6">{children}</main>
          </div>
        </body>
      </html>
    );
  }
