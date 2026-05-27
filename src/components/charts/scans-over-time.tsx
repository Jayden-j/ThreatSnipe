"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface ScansOverTimeProps {
  data: { date: string; count: number }[];
}

export function ScansOverTime({ data }: ScansOverTimeProps) {
  const hasData = data.some((d) => d.count > 0);

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Scan Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    });
                  }}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  stroke="#94a3b8"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a1a2e",
                    border: "1px solid #00ff88",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                  labelFormatter={(val) => {
                    const d = new Date(val);
                    return d.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#00ff88"
                  strokeWidth={2}
                  dot={{ fill: "#00ff88", r: 4 }}
                  activeDot={{ r: 6, fill: "#00ff88" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">No scan activity yet</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}