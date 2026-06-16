import Link from "next/link";

const LINKS = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Sign in", href: "/login" },
  { label: "Register", href: "/register" },
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
];

export function LandingFooter() {
  return (
    <footer
      className="relative px-6 pb-10 pt-16"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          {/* Logo + tagline */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="flex items-center gap-2.5 group" aria-label="ThreatSnipe home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/ThreatSnipe logo.jpg"
                alt="ThreatSnipe logo"
                width={36}
                height={36}
                className="h-9 w-9 object-contain transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(99,102,241,0.7)]"
              />
              <span className="font-semibold text-white tracking-tight text-[15px] font-body">
                ThreatSnipe
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-[260px] leading-relaxed font-body">
              Real-time threat intelligence for modern security teams.
            </p>
          </div>

          {/* Nav links */}
          <nav className="flex flex-wrap gap-x-6 gap-y-3" aria-label="Footer navigation">
            {LINKS.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-sm text-slate-500 hover:text-slate-300 transition-colors duration-200 font-body"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-xs text-slate-600 font-body">
            © 2026 ThreatSnipe. Built by{" "}
            <a
              href="https://github.com/Jayden-j"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-2"
            >
              Jayden Johnson
            </a>
            .
          </p>
          <p className="text-xs text-slate-600 font-body">
            Powered by AbuseIPDB · VirusTotal · DNSBL
          </p>
        </div>
      </div>
    </footer>
  );
}
