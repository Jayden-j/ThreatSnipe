"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { TOOLS, type ToolDef } from "@/lib/tools";

interface RelatedToolsProps {
  currentHref: string;
  currentInput: string;
  visible: boolean;
}

function useSuggestions(currentHref: string): { tool: ToolDef; isSameCat: boolean }[] {
  return useMemo(() => {
    const current = TOOLS.find((t) => t.href === currentHref);
    if (!current) return [];

    const sameCat = TOOLS.filter(
      (t) => t.category === current.category && t.href !== currentHref
    );
    // Exclude /bulk from random picks (no meaningful single-input carry-over)
    const diffCat = TOOLS.filter(
      (t) => t.category !== current.category && t.href !== "/bulk"
    );

    // Deterministic "random" pick: rotate by current hour so it varies through the day
    const seed = new Date().getHours();
    const randomIdx = diffCat.length > 0 ? seed % diffCat.length : 0;

    const picks: { tool: ToolDef; isSameCat: boolean }[] = [];

    // Fill up to 2 from same category
    const samePicks = sameCat.slice(0, 2);
    samePicks.forEach((t) => picks.push({ tool: t, isSameCat: true }));

    // If same category had fewer than 2, backfill with diff-category tools
    if (picks.length < 2 && diffCat.length > 0) {
      const extra = diffCat.find((_, i) => i !== randomIdx);
      if (extra) picks.push({ tool: extra, isSameCat: false });
    }

    // Add 1 tool from a different category
    const randomTool = diffCat[randomIdx];
    if (randomTool && !picks.some((p) => p.tool.href === randomTool.href)) {
      picks.push({ tool: randomTool, isSameCat: false });
    }

    return picks.slice(0, 3);
  }, [currentHref]);
}

function makeHref(tool: ToolDef, currentInput: string): string {
  if (!currentInput.trim()) return tool.href;
  return `${tool.href}?q=${encodeURIComponent(currentInput.trim())}`;
}

// ─── Desktop sidebar card ────────────────────────────────────────────────────

function SidebarCard({
  tool,
  currentInput,
  isSameCat,
}: {
  tool: ToolDef;
  currentInput: string;
  isSameCat: boolean;
}) {
  const Icon = tool.icon;
  const [hovered, setHovered] = useState(false);
  const href = makeHref(tool, currentInput);

  return (
    <Link
      href={href}
      prefetch={false}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="rounded-xl border p-4 transition-all duration-200 cursor-pointer"
        style={{
          borderColor: hovered ? tool.borderHover : "rgba(255,255,255,0.06)",
          backgroundColor: hovered ? tool.iconBg : "rgba(255,255,255,0.015)",
        }}
      >
        {/* Icon */}
        <div
          className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ backgroundColor: tool.iconBg }}
        >
          <Icon className={`h-4 w-4 ${tool.iconColor}`} />
        </div>

        {/* Name + category tag for cross-category picks */}
        <div className="mb-1 flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight text-foreground">
            {tool.label}
          </p>
          {!isSameCat && (
            <span className="mt-0.5 shrink-0 text-[10px] font-medium text-muted-foreground/60">
              {tool.category}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {tool.description}
        </p>

        {/* Try → */}
        <div
          className="mt-3 flex items-center gap-1 transition-opacity duration-150"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <span className={`text-xs font-semibold ${tool.iconColor}`}>Try</span>
          <ArrowRight className={`h-3 w-3 ${tool.iconColor}`} />
        </div>
      </div>
    </Link>
  );
}

// ─── Desktop sidebar ─────────────────────────────────────────────────────────

export function RelatedTools({ currentHref, currentInput, visible }: RelatedToolsProps) {
  const suggestions = useSuggestions(currentHref);

  return (
    <AnimatePresence>
      {visible && (
        <motion.aside
          className="hidden lg:flex w-56 xl:w-60 shrink-0 flex-col"
          initial={{ opacity: 0, x: 18 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 18 }}
          transition={{ duration: 0.35, ease: [0.25, 0, 0, 1] }}
        >
          <div className="sticky top-24 flex flex-col gap-2">
            <p className="mb-1 px-0.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              Try these tools
            </p>
            {suggestions.map(({ tool, isSameCat }) => (
              <SidebarCard
                key={tool.href}
                tool={tool}
                currentInput={currentInput}
                isSameCat={isSameCat}
              />
            ))}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ─── Mobile horizontal strip ─────────────────────────────────────────────────

export function RelatedToolsStrip({
  currentHref,
  currentInput,
}: Omit<RelatedToolsProps, "visible">) {
  const suggestions = useSuggestions(currentHref);

  return (
    <div className="lg:hidden">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
        Try these tools
      </p>
      <div
        className="flex gap-3 overflow-x-auto pb-1"
        style={{ scrollbarWidth: "none" }}
      >
        {suggestions.map(({ tool, isSameCat }) => {
          const Icon = tool.icon;
          const href = makeHref(tool, currentInput);
          return (
            <Link key={tool.href} href={href} prefetch={false}>
              <div
                className="flex min-w-[172px] shrink-0 items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.015] px-3 py-2.5 transition-all duration-150 hover:border-white/[0.12] hover:bg-white/[0.03]"
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: tool.iconBg }}
                >
                  <Icon className={`h-3.5 w-3.5 ${tool.iconColor}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    {tool.label}
                  </p>
                  {!isSameCat && (
                    <p className="text-[10px] text-muted-foreground">
                      {tool.category}
                    </p>
                  )}
                </div>
                <ChevronRight className={`h-3.5 w-3.5 shrink-0 ${tool.iconColor}`} />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
