"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ActivityIcon,
  CoinsIcon,
  DollarSignIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

export function AdminSectionCards({ data, onRefresh, isRefreshing = false }) {
  if (!data) return null;

  const { userStats, tokenStats, revenueStats, usageStats } = data;

  // Calculate growth percentages and trends
  const calculateTrend = (current, previous = 0) => {
    if (previous === 0) return { percentage: 0, isUp: current > 0 };
    const percentage = ((current - previous) / previous) * 100;
    return {
      percentage: Math.abs(percentage).toFixed(1),
      isUp: percentage >= 0,
    };
  };

  // Calculate verification rate
  const verificationRate =
    userStats.totalUsers > 0
      ? ((userStats.verifiedUsers / userStats.totalUsers) * 100).toFixed(1)
      : 0;

  // Calculate token utilization
  const totalTokensDistributed =
    tokenStats.totalTokensGranted + tokenStats.totalTokensPurchased;
  const tokenUtilization =
    totalTokensDistributed > 0
      ? ((tokenStats.totalTokensUsed / totalTokensDistributed) * 100).toFixed(1)
      : 0;

  // Calculate average revenue per user
  const avgRevenuePerUser =
    userStats.totalUsers > 0
      ? (revenueStats.totalRevenueUSD / userStats.totalUsers).toFixed(2)
      : 0;

  const cards = [
    {
      title: "Total Users",
      value: userStats.totalUsers?.toLocaleString() || "0",
      description: "Registered users",
      trend: { percentage: "12.5", isUp: true }, // Mock trend - you can calculate real trends
      footer: {
        text: `${userStats.verifiedUsers} verified (${verificationRate}% rate)`,
        subText: `${userStats.newUsersToday} new today`,
      },
      icon: UsersIcon,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Revenue",
      value: `$${revenueStats.totalRevenueUSD?.toLocaleString() || "0"}`,
      description: "Mock purchases",
      trend: { percentage: "8.3", isUp: true },
      footer: {
        text: `${revenueStats.totalPurchases} total purchases`,
        subText: `Avg: $${
          revenueStats.averagePurchaseUSD?.toFixed(2) || "0"
        } per purchase`,
      },
      icon: DollarSignIcon,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Active Users",
      value: userStats.activeUsers?.toLocaleString() || "0",
      description: "Last 7 days",
      trend: {
        percentage:
          userStats.totalUsers > 0
            ? ((userStats.activeUsers / userStats.totalUsers) * 100).toFixed(1)
            : "0",
        isUp: userStats.activeUsers > 0,
      },
      footer: {
        text: `${(
          (userStats.activeUsers / Math.max(userStats.totalUsers, 1)) *
          100
        ).toFixed(1)}% engagement rate`,
        subText: "Strong user retention",
      },
      icon: ActivityIcon,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Token Usage",
      value: `${((tokenStats.totalTokensUsed || 0) / 1000000).toFixed(1)}M`,
      description: "Tokens consumed",
      trend: { percentage: tokenUtilization, isUp: tokenUtilization > 0 },
      footer: {
        text: `${tokenUtilization}% utilization rate`,
        subText: `${((tokenStats.totalTokensRemaining || 0) / 1000000).toFixed(
          1
        )}M remaining`,
      },
      icon: CoinsIcon,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
      {cards.map((card, index) => {
        const TrendIcon = card.trend.isUp ? TrendingUpIcon : TrendingDownIcon;
        const trendColor = card.trend.isUp ? "text-green-600" : "text-red-600";
        const Icon = card.icon;

        return (
          <Card key={index} className="@container/card">
            <CardHeader className="pb-2">
              {/* Top Row: Description and Icon */}
              <div className="flex items-start justify-between mb-2">
                <CardDescription className="text-sm font-medium">
                  {card.description}
                </CardDescription>

                {/* Icon */}
                <div
                  className={`w-10 h-10 ${card.iconBg} rounded-lg flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
              </div>

              {/* Second Row: Value and Trend */}
              <div className="flex items-start justify-between">
                <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                  {card.value}
                </CardTitle>

                {/* Trend Badge */}
                <Badge
                  variant="outline"
                  className={`flex gap-1 rounded-lg text-xs ${trendColor} border-current flex-shrink-0 ml-2`}
                >
                  <TrendIcon className="size-3" />
                  {card.trend.isUp ? "+" : "-"}
                  {card.trend.percentage}%
                </Badge>
              </div>
            </CardHeader>

            <CardFooter className="flex-col items-start gap-1 text-sm pt-0">
              <div
                className={`line-clamp-1 flex gap-2 font-medium ${trendColor}`}
              >
                {card.footer.text} <TrendIcon className="size-4" />
              </div>
              <div className="text-muted-foreground text-xs">
                {card.footer.subText}
              </div>
            </CardFooter>
          </Card>
        );
      })}

      {/* Refresh Button Card - Optional */}
      {onRefresh && (
        <Card className="@container/card border-dashed">
          <CardHeader className="text-center">
            <CardDescription>Data Status</CardDescription>
            <div className="py-4">
              <Button
                onClick={onRefresh}
                disabled={isRefreshing}
                variant="outline"
                className="w-full"
              >
                <TrendingUpIcon
                  className={`w-4 h-4 mr-2 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh Data"}
              </Button>
            </div>
          </CardHeader>
          <CardFooter className="text-center text-xs text-muted-foreground">
            Live data from Firebase
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
