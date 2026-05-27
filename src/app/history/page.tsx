import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { History, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

type ThreatLevel = "CLEAN" | "SUSPICIOUS" | "THREAT";

interface Scan {
  id: string;
  ip_address: string;
  abuse_score: number;
  country: string;
  isp: string;
  threat_level: ThreatLevel;
  created_at: string;
}

function getScoreColor(score: number): string {
  if (score < 15) return "text-green-500";
  if (score <= 50) return "text-yellow-500";
  return "text-red-500";
}

function getThreatBadge(threat: ThreatLevel) {
  const styles = {
    CLEAN: "border-green-500/50 text-green-500 bg-green-500/10",
    SUSPICIOUS: "border-yellow-500/50 text-yellow-500 bg-yellow-500/10",
    THREAT: "border-red-500/50 text-red-500 bg-red-500/10",
  };

  return (
    <Badge variant="outline" className={styles[threat]}>
      {threat}
    </Badge>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ScanHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: scans } = await supabase
    .from("scans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <History className="h-6 w-6 text-primary" />
          Scan History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your past IP reputation scans.
        </p>
      </div>

      {!scans || scans.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center">
          <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No scans yet. Run your first IP lookup.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">IP Address</TableHead>
                <TableHead className="text-muted-foreground">Score</TableHead>
                <TableHead className="text-muted-foreground">Country</TableHead>
                <TableHead className="text-muted-foreground">ISP</TableHead>
                <TableHead className="text-muted-foreground">Threat Level</TableHead>
                <TableHead className="text-muted-foreground">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(scans as Scan[]).map((scan) => (
                <TableRow key={scan.id} className="border-border hover:bg-secondary/50">
                  <TableCell className="font-mono text-sm text-foreground">
                    {scan.ip_address}
                  </TableCell>
                  <TableCell className={`font-semibold ${getScoreColor(scan.abuse_score)}`}>
                    {scan.abuse_score}
                  </TableCell>
                  <TableCell className="text-foreground">{scan.country}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {scan.isp}
                  </TableCell>
                  <TableCell>{getThreatBadge(scan.threat_level)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(scan.created_at)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}