"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart as PieChartIcon } from "lucide-react";

interface ThreatBreakdownProps {
  clean: number;
  suspicious: number;
  threat: number;
}

const COLORS = {
  CLEAN: "#22c55e",
  SUSPICIOUS: "#f59e0b",
  THREAT: "#ef4444",
};

export function ThreatBreakdown({ clean, suspicious, threat }: ThreatBreakdownProps) {
  const data = [
    { name: "CLEAN", value: clean, color: COLORS.CLEAN },
    { name: "SUSPICIOUS", value: suspicious, color: COLORS.SUSPICIOUS },
    { name: "THREAT", value: threat, color: COLORS.THREAT },
  ].filter((item) => item.value > 0);

  const hasData = clean > 0 || suspicious > 0 || threat > 0;

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChartIcon className="h-5 w-5 text-primary" />
          Threat Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="flex flex-col items-center">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    contentStyle={{
                      backgroundColor: "#0f0f1a",
                      border: "1px solid rgba(99,102,241,0.35)",
                      borderRadius: "8px",
                      color: "#f1f5f9",
                    }}
                    formatter={(value, name) => [value, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Custom legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {data.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {item.name === "CLEAN"
                      ? "Clean"
                      : item.name === "SUSPICIOUS"
                        ? "Suspicious"
                        : "Threat"}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No scans yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}