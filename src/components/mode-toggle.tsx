"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

function SunGlyph({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 9 9"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <circle cx="4.5" cy="4.5" r="1.9" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
        <rect
          key={deg}
          x="4.1"
          y="0.25"
          width="0.8"
          height="1.5"
          rx="0.4"
          transform={`rotate(${deg} 4.5 4.5)`}
        />
      ))}
    </svg>
  );
}

function MoonGlyph({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      width="8"
      height="8"
      viewBox="0 0 8 8"
      fill="currentColor"
      className={className}
      style={style}
      aria-hidden
    >
      <path d="M6.9 5.3A3.3 3.3 0 0 1 2.7 1.1a3.3 3.3 0 1 0 4.2 4.2z" />
    </svg>
  );
}

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";

  const toggle = () => {
    // Inject global color transitions for the switch duration only
    document.documentElement.classList.add("theme-transitioning");
    setTheme(isDark ? "light" : "dark");
    setTimeout(() => {
      document.documentElement.classList.remove("theme-transitioning");
    }, 700);
  };

  // Render a placeholder identical in size to avoid layout shift
  if (!mounted) {
    return (
      <div
        style={{ width: 48, height: 26 }}
        className="rounded-full flex-shrink-0"
      />
    );
  }

  return (
    <button
      onClick={toggle}
      role="switch"
      aria-checked={!isDark}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      className="relative flex-shrink-0 rounded-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{
        width: 48,
        height: 26,
        background: isDark
          ? "oklch(0.12 0.012 270)"
          : "oklch(0.90 0.028 82)",
        border: `1.5px solid ${
          isDark ? "oklch(0.21 0.018 270)" : "oklch(0.78 0.045 82)"
        }`,
        boxShadow: isDark
          ? "inset 0 1.5px 3px rgba(0,0,0,0.45)"
          : "inset 0 1.5px 3px rgba(0,0,0,0.12)",
        transition: "background 400ms ease, border-color 400ms ease, box-shadow 400ms ease",
      }}
    >
      {/* Sun glyph — left side of track */}
      <SunGlyph
        style={{
          position: "absolute",
          left: 5,
          top: "50%",
          transform: "translateY(-50%)",
          color: isDark
            ? "oklch(0.30 0.014 270)"
            : "oklch(0.52 0.14 82)",
          transition: "color 400ms ease",
          pointerEvents: "none",
        }}
      />

      {/* Moon glyph — right side of track */}
      <MoonGlyph
        style={{
          position: "absolute",
          right: 5,
          top: "50%",
          transform: "translateY(-50%)",
          color: isDark
            ? "oklch(0.64 0.11 282)"
            : "oklch(0.70 0.04 270)",
          transition: "color 400ms ease",
          pointerEvents: "none",
        }}
      />

      {/* Sliding thumb */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: isDark
            ? "linear-gradient(145deg, oklch(0.97 0 0), oklch(0.88 0 0))"
            : "linear-gradient(145deg, oklch(0.28 0.018 270), oklch(0.18 0.015 270))",
          boxShadow: isDark
            ? "0 1px 4px rgba(0,0,0,0.55), 0 0 0 0.5px rgba(255,255,255,0.08)"
            : "0 1px 3px rgba(0,0,0,0.30), 0 0 0 0.5px rgba(0,0,0,0.04)",
          transform: `translateX(${isDark ? 26 : 3}px)`,
          transition:
            "transform 620ms cubic-bezier(0.25, 1.25, 0.5, 1), background 600ms ease, box-shadow 600ms ease",
        }}
      />
    </button>
  );
}
