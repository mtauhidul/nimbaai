"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, Calendar, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function AdminChartAreaInteractive({ data }) {
  const [timeRange, setTimeRange] = useState("7d");

  if (!data) return null;

  // Generate sample chart data based on real metrics
  const generateChartData = () => {
    const { userStats, revenueStats, tokenStats } = data;
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;

    return Array.from({ length: days }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));

      // Simulate realistic data trends
      const baseUsers = Math.max(1, Math.floor(userStats.totalUsers / days));
      const baseRevenue = Math.max(0, revenueStats.totalRevenueUSD / days);
      const baseTokens = Math.max(
        0,
        tokenStats.totalTokensUsed / days / 1000000
      );

      // Add some variance
      const variance = 0.3;
      const userVariance = 1 + (Math.random() - 0.5) * variance;
      const revenueVariance = 1 + (Math.random() - 0.5) * variance;
      const tokenVariance = 1 + (Math.random() - 0.5) * variance;

      return {
        date: date.toISOString().split("T")[0],
        dateFormatted: date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        users: Math.round(baseUsers * userVariance),
        revenue: Math.round(baseRevenue * revenueVariance * 100) / 100,
        tokens: Math.round(baseTokens * tokenVariance * 10) / 10,
      };
    });
  };

  const chartData = generateChartData();

  // Calculate totals for the period
  const periodTotals = chartData.reduce(
    (acc, day) => ({
      users: acc.users + day.users,
      revenue: acc.revenue + day.revenue,
      tokens: acc.tokens + day.tokens,
    }),
    { users: 0, revenue: 0, tokens: 0 }
  );

  const formatTooltipValue = (value, name) => {
    switch (name) {
      case "users":
        return [value.toLocaleString(), "New Users"];
      case "revenue":
        return [`$${value.toFixed(2)}`, "Revenue"];
      case "tokens":
        return [`${value}M`, "Tokens Used"];
      default:
        return [value, name];
    }
  };

  return (
    <Card className="@container/chart">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Platform Activity Overview
          </CardTitle>
          <CardDescription>
            Daily trends for users, revenue, and token usage
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] rounded-lg sm:ml-auto"
            aria-label="Select time range"
          >
            <Calendar className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="7d" className="rounded-lg">
              Last 7 days
            </SelectItem>
            <SelectItem value="30d" className="rounded-lg">
              Last 30 days
            </SelectItem>
            <SelectItem value="90d" className="rounded-lg">
              Last 90 days
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {periodTotals.users.toLocaleString()}
            </div>
            <div className="text-sm text-blue-700">New Users</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              ${periodTotals.revenue.toFixed(2)}
            </div>
            <div className="text-sm text-green-700">Revenue</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {periodTotals.tokens.toFixed(1)}M
            </div>
            <div className="text-sm text-purple-700">Tokens Used</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="dateFormatted"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", opacity: 0.6 }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-md">
                        <div className="grid gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              {label}
                            </span>
                          </div>
                          {payload.map((item, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <div
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: item.color }}
                              />
                              <span className="text-sm font-medium">
                                {
                                  formatTooltipValue(
                                    item.value,
                                    item.dataKey
                                  )[1]
                                }
                                :
                              </span>
                              <span className="text-sm">
                                {
                                  formatTooltipValue(
                                    item.value,
                                    item.dataKey
                                  )[0]
                                }
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                dataKey="users"
                type="natural"
                fill="url(#fillUsers)"
                stroke="#3B82F6"
                strokeWidth={2}
                stackId="1"
              />
              <Area
                dataKey="tokens"
                type="natural"
                fill="url(#fillTokens)"
                stroke="#8B5CF6"
                strokeWidth={2}
                stackId="2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-muted-foreground">New Users</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-muted-foreground">Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-muted-foreground">Token Usage</span>
          </div>
        </div>

        {/* Insights */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="font-medium text-sm">Key Insights</span>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              • Average daily users:{" "}
              {Math.round(periodTotals.users / chartData.length)} new
              registrations
            </p>
            <p>
              • Daily revenue average: $
              {(periodTotals.revenue / chartData.length).toFixed(2)}
            </p>
            <p>
              • Token consumption rate:{" "}
              {(periodTotals.tokens / chartData.length).toFixed(1)}M tokens/day
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
