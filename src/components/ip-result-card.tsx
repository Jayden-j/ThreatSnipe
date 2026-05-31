import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Globe, Building2, FileWarning, Calendar, Network } from "lucide-react";

interface IpResultData {
  ip: string;
  abuseScore: number;
  country: string;
  isp: string;
  totalReports: number;
  lastReported: string | null;
  originalInput?: string;
  isDomain?: boolean;
  resolvedIp?: string;
}

const COUNTRY_NAMES: Record<string, { name: string; flag: string }> = {
  US: { name: "United States", flag: "🇺🇸" },
  GB: { name: "United Kingdom", flag: "🇬🇧" },
  AU: { name: "Australia", flag: "🇦🇺" },
  CA: { name: "Canada", flag: "🇨🇦" },
  DE: { name: "Germany", flag: "🇩🇪" },
  FR: { name: "France", flag: "🇫🇷" },
  JP: { name: "Japan", flag: "🇯🇵" },
  CN: { name: "China", flag: "🇨🇳" },
  IN: { name: "India", flag: "🇮🇳" },
  BR: { name: "Brazil", flag: "🇧🇷" },
  RU: { name: "Russia", flag: "🇷🇺" },
  KR: { name: "South Korea", flag: "🇰🇷" },
  NL: { name: "Netherlands", flag: "🇳🇱" },
  SE: { name: "Sweden", flag: "🇸🇪" },
  NO: { name: "Norway", flag: "🇳🇴" },
  FI: { name: "Finland", flag: "🇫🇮" },
  DK: { name: "Denmark", flag: "🇩🇰" },
  SG: { name: "Singapore", flag: "🇸🇬" },
  HK: { name: "Hong Kong", flag: "🇭🇰" },
  TW: { name: "Taiwan", flag: "🇹🇼" },
  ZA: { name: "South Africa", flag: "🇿🇦" },
  IE: { name: "Ireland", flag: "🇮🇪" },
  CH: { name: "Switzerland", flag: "🇨🇭" },
  IT: { name: "Italy", flag: "🇮🇹" },
  ES: { name: "Spain", flag: "🇪🇸" },
  MX: { name: "Mexico", flag: "🇲🇽" },
  AR: { name: "Argentina", flag: "🇦🇷" },
  IL: { name: "Israel", flag: "🇮🇱" },
  PL: { name: "Poland", flag: "🇵🇱" },
  AT: { name: "Austria", flag: "🇦🇹" },
  BE: { name: "Belgium", flag: "🇧🇪" },
  PT: { name: "Portugal", flag: "🇵🇹" },
  CZ: { name: "Czech Republic", flag: "🇨🇿" },
  HU: { name: "Hungary", flag: "🇭🇺" },
  GR: { name: "Greece", flag: "🇬🇷" },
  RO: { name: "Romania", flag: "🇷🇴" },
  UA: { name: "Ukraine", flag: "🇺🇦" },
  TR: { name: "Turkey", flag: "🇹🇷" },
  SA: { name: "Saudi Arabia", flag: "🇸🇦" },
  AE: { name: "United Arab Emirates", flag: "🇦🇪" },
  ID: { name: "Indonesia", flag: "🇮🇩" },
  MY: { name: "Malaysia", flag: "🇲🇾" },
  PH: { name: "Philippines", flag: "🇵🇭" },
  TH: { name: "Thailand", flag: "🇹🇭" },
  VN: { name: "Vietnam", flag: "🇻🇳" },
  NZ: { name: "New Zealand", flag: "🇳🇿" },
  NG: { name: "Nigeria", flag: "🇳🇬" },
  KE: { name: "Kenya", flag: "🇰🇪" },
  EG: { name: "Egypt", flag: "🇪🇬" },
};

function getThreatBadge(score: number) {
  if (score < 15) return { label: "CLEAN", variant: "secondary" as const };
  if (score <= 50) return { label: "SUSPICIOUS", variant: "default" as const };
  return { label: "MALICIOUS", variant: "destructive" as const };
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

function getProgressColor(score: number): string {
  if (score < 15) return "#22c55e";
  if (score <= 50) return "#eab308";
  return "#ef4444";
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
  const scoreColor = getScoreColor(data.abuseScore);
  const scoreBg = getScoreBg(data.abuseScore);
  const progressColor = getProgressColor(data.abuseScore);

  const countryInfo = COUNTRY_NAMES[data.country] ?? { name: data.country, flag: "🌐" };

  const badgeClasses = cn(
    "px-4 py-1.5 text-sm font-semibold",
    badge.variant === "secondary" &&
      "border-green-500/50 bg-green-500/10 text-green-500",
    badge.variant === "default" &&
      "border-yellow-500/50 bg-yellow-500/10 text-yellow-500",
    badge.variant === "destructive" &&
      "border-red-500/50 bg-red-500/10 text-red-500"
  );

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="font-mono text-xl text-foreground">
            {data.isDomain && data.originalInput ? data.originalInput : data.ip}
          </CardTitle>
          {data.isDomain && data.resolvedIp && (
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Network className="h-3.5 w-3.5" />
              Resolved IP: {data.resolvedIp}
            </p>
          )}
        </div>
        <Badge className={badgeClasses}>{badge.label}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Abuse Confidence Score with Progress Bar */}
        <div className={cn("rounded-lg border p-4", scoreBg)}>
          <p className="mb-1 text-sm text-muted-foreground">
            Abuse Confidence Score
          </p>
          <p className={cn("text-3xl font-bold", scoreColor)}>
            {data.abuseScore}/100
          </p>
          {/* Progress bar */}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${data.abuseScore}%`,
                backgroundColor: progressColor,
              }}
            />
          </div>
          {data.totalReports > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Based on {data.totalReports.toLocaleString()} reports
            </p>
          )}
        </div>

        {/* Info cards grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-md bg-secondary p-3">
            <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="truncate text-sm font-medium text-foreground">
                {countryInfo.flag} {countryInfo.name}
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