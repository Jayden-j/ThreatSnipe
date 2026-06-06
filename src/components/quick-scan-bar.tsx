"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;

export function QuickScanBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleScan = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (IP_REGEX.test(trimmed)) {
      router.push(`/lookup?ip=${encodeURIComponent(trimmed)}`);
    } else {
      router.push(`/domain?domain=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          className="pl-9 bg-card border-border/60 font-mono text-sm placeholder:font-sans placeholder:text-muted-foreground/50 focus-visible:border-primary/50 focus-visible:ring-primary/30"
          placeholder="Quick scan — enter an IP or domain and press Enter..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
        />
      </div>
      <Button onClick={handleScan} disabled={!query.trim()}>
        Scan
      </Button>
    </div>
  );
}
