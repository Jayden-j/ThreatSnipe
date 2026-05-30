"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Search, Shield } from "lucide-react";

export default function BulkPage() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Shield className="h-6 w-6 text-primary" />
          Bulk Check
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check multiple IPs or domains at once.
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter IPs or domains, one per line"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="border-border bg-secondary pl-10 text-foreground"
            disabled={loading}
          />
        </div>
        <Button disabled={loading} className="bg-primary text-primary-foreground">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            "Scan"
          )}
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Results will appear here
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enter targets above and click Scan to begin.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}