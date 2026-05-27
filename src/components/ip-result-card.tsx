import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Globe, Building2, FileWarning, Calendar } from "lucide-react";

interface IpResultData {
  ip: string;
  abuseScore: number;
  country: string;
  isp: string;
  totalReports: number;
  lastReported: string | null;
}

function getThreatBadge(score: number) {
  if (score < 15) return { label: "CLEAN", variant: "secondary" as const };
  if (score <= 50) return { label: "SUSPICIOUS", variant: "default" as const };
  return { label: "THREAT", variant: "destructive" as const };
}

function getScoreColor(score: number): string {
  if (score < 15) return "text-green-500";
  if (score <= 50) return "text-yellow-500";
  return "text-red-500";
}

function getScoreBg(score: number): string {
  if (score < 15) return "bg-green-500/10 border-green-500/20";
  if (score <= 50) return "bg-yellow-500/10 border-yellow-500/20";
  return "bg-red-500/10 border-red-500/20";
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface IpResultCardProps {
  data: IpResultData;
}

export function IpResultCard({ data }: IpResultCardProps) {
  const badge = getThreatBadge(data.abuseScore);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="font-mono text-xl text-foreground">
          {data.ip}
        </CardTitle>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={cn("rounded-lg border p-4", getScoreBg(data.abuseScore))}
        >
          <p className="mb-1 text-sm text-muted-foreground">
            Abuse Confidence Score
          </p>
          <p
            className={cn("text-3xl font-bold", getScoreColor(data.abuseScore))}
          >
            {data.abuseScore}/100
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-md bg-secondary p-3">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="truncate text-sm font-medium text-foreground">
                {data.country}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md bg-secondary p-3">
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">ISP</p>
              <p className="truncate text-sm font-medium text-foreground">
                {data.isp}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md bg-secondary p-3">
            <FileWarning className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total Reports</p>
              <p className="truncate text-sm font-medium text-foreground">
                {data.totalReports}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md bg-secondary p-3">
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Last Reported</p>
              <p className="truncate text-sm font-medium text-foreground">
                {formatDate(data.lastReported)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
