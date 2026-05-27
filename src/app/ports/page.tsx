"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  ScanLine,
  Unlock,
  Lock,
  Shield,
  Search,
  Info,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";

interface PortInfo {
  port: number;
  protocol: string;
  state: string;
  service: string;
}

interface PortScanResult {
  target: string;
  host: string;
  ports: PortInfo[];
  openCount: number;
  closedCount: number;
  filteredCount: number;
  scanDate: string;
}

interface NotablePort {
  port: number;
  service: string;
  description: string;
  risky: boolean;
}

const NOTABLE_PORTS: NotablePort[] = [
  { port: 22, service: "SSH", description: "Remote access enabled", risky: false },
  { port: 23, service: "Telnet", description: "Unencrypted remote access (risky)", risky: true },
  { port: 21, service: "FTP", description: "File transfer (consider SFTP instead)", risky: false },
  { port: 3389, service: "RDP", description: "Remote Desktop exposed", risky: true },
  { port: 3306, service: "MySQL", description: "Database port exposed", risky: true },
  { port: 6379, service: "Redis", description: "Cache port exposed", risky: true },
  { port: 27017, service: "MongoDB", description: "Database port exposed", risky: true },
  { port: 80, service: "HTTP", description: "Web server running", risky: false },
  { port: 443, service: "HTTPS", description: "Secure web server running", risky: false },
];

function getStateBadge(state: string) {
  switch (state) {
    case "open":
      return (
        <Badge
          variant="outline"
          className="border-green-500/50 bg-green-500/10 text-green-500"
        >
          open
        </Badge>
      );
    case "closed":
      return (
        <Badge
          variant="outline"
          className="border-red-500/50 bg-red-500/10 text-red-500"
        >
          closed
        </Badge>
      );
    case "filtered":
      return (
        <Badge
          variant="outline"
          className="border-yellow-500/50 bg-yellow-500/10 text-yellow-500"
        >
          filtered
        </Badge>
      );
    default:
      return <Badge variant="outline">{state}</Badge>;
  }
}

function PortForm() {
  const searchParams = useSearchParams();
  const [targetInput, setTargetInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PortScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const autoTriggered = useRef(false);

  useEffect(() => {
    const target = searchParams.get("target");
    if (target && !autoTriggered.current) {
      autoTriggered.current = true;
      setTargetInput(target);
      // Auto-trigger the scan
      setLoading(true);
      fetch(`/api/ports?target=${encodeURIComponent(target)}`)
        .then(async (response) => {
          if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error || "Port scan failed");
          }
          const data: PortScanResult = await response.json();
          setResult(data);
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmedTarget = targetInput.trim();
    if (!trimmedTarget) {
      setError("Please enter an IP address or hostname");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/ports?target=${encodeURIComponent(trimmedTarget)}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "Port scan failed");
      }

      const data: PortScanResult = await response.json();
      setResult(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Sort ports: open first, then filtered, then closed
  const sortedPorts = result
    ? [...result.ports].sort((a, b) => {
        const stateOrder: Record<string, number> = {
          open: 0,
          filtered: 1,
          closed: 2,
        };
        const aOrder = stateOrder[a.state] ?? 3;
        const bOrder = stateOrder[b.state] ?? 3;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return a.port - b.port;
      })
    : [];

  // Get notable ports that are open
  const openPortNumbers = new Set(
    result?.ports.filter((p) => p.state === "open").map((p) => p.port) ?? []
  );
  const notableOpenServices = NOTABLE_PORTS.filter((np) =>
    openPortNumbers.has(np.port)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ScanLine className="h-6 w-6 text-primary" />
          Port Scanner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Scan common ports on an IP address or hostname.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="192.168.1.1 or example.com"
            value={targetInput}
            onChange={(e) => setTargetInput(e.target.value)}
            className="border-border bg-secondary pl-10 text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
            disabled={loading}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scanning ports... this may take 10–20 seconds
            </>
          ) : (
            "Scan Ports"
          )}
        </Button>
      </form>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="space-y-3">
          <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
          <div className="flex gap-3">
            <div className="h-24 flex-1 animate-pulse rounded-lg bg-secondary" />
            <div className="h-24 flex-1 animate-pulse rounded-lg bg-secondary" />
            <div className="h-24 flex-1 animate-pulse rounded-lg bg-secondary" />
          </div>
          <div className="h-64 animate-pulse rounded-lg bg-secondary" />
        </div>
      )}

      {result && !loading && (
        <div className="space-y-6">
          {/* Resolved hostname/IP */}
          {result.host && result.host !== result.target && (
            <p className="text-sm text-muted-foreground">
              Resolved: {result.host}
            </p>
          )}

          {/* Summary stat boxes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-4">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4 text-green-500" />
                <p className="text-sm text-muted-foreground">Open</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-green-500">
                {result.openCount}
              </p>
            </div>
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-red-500" />
                <p className="text-sm text-muted-foreground">Closed</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-red-500">
                {result.closedCount}
              </p>
            </div>
            <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-yellow-500" />
                <p className="text-sm text-muted-foreground">Filtered</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-yellow-500">
                {result.filteredCount}
              </p>
            </div>
          </div>

          {/* Port table */}
          <Card className="border-border bg-card">
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Port</TableHead>
                    <TableHead className="w-[100px]">Protocol</TableHead>
                    <TableHead className="w-[100px]">State</TableHead>
                    <TableHead>Service</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPorts.map((port) => (
                    <TableRow key={`${port.port}/${port.protocol}`}>
                      <TableCell className="font-mono text-foreground">
                        {port.port}/{port.protocol}
                      </TableCell>
                      <TableCell className="font-mono text-muted-foreground uppercase">
                        {port.protocol}
                      </TableCell>
                      <TableCell>{getStateBadge(port.state)}</TableCell>
                      <TableCell className="font-mono text-foreground">
                        {port.service}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notable Open Services */}
          {notableOpenServices.length > 0 && (
            <Card className="border-border bg-card">
              <CardContent className="p-6">
                <h3 className="mb-4 text-sm font-medium text-muted-foreground">
                  Notable Open Services
                </h3>
                <div className="space-y-2">
                  {notableOpenServices.map((np) => (
                    <div
                      key={np.port}
                      className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
                    >
                      {np.risky ? (
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-yellow-500" />
                      ) : (
                        <Info className="h-5 w-5 flex-shrink-0 text-blue-400" />
                      )}
                      <div>
                        <p className="font-mono text-sm font-medium text-foreground">
                          {np.port}/{np.service.toLowerCase()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {np.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default function PortsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
              <ScanLine className="h-6 w-6 text-primary" />
              Port Scanner
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Scan common ports on an IP address or hostname.
            </p>
          </div>
          <div className="space-y-3">
            <div className="h-10 w-full animate-pulse rounded bg-secondary" />
            <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
            <div className="h-24 animate-pulse rounded-lg bg-secondary" />
          </div>
        </div>
      }
    >
      <PortForm />
    </Suspense>
  );
}