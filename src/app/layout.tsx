import type { Metadata } from "next";
import { Antic } from "next/font/google";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

const antic = Antic({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Centry — Cyber Threat Monitor",
  description: "Cybersecurity threat monitoring dashboard",
  icons: { icon: "/logo.png" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${antic.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
      style={{ fontSize: "115%" }}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
