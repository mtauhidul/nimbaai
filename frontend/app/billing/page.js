// app/billing/page.js - Billing Dashboard with Purchase History & Token Stats
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore } from "@/stores/authStore";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Coins,
  CreditCard,
  Plus,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BillingPage = () => {
  const router = useRouter();
  const {
    user,
    tokens,
    preferredCurrency,
    fetchTokenStats,
    fetchPurchaseHistory,
  } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [tokenStats, setTokenStats] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);

      const [stats, history] = await Promise.all([
        fetchTokenStats(),
        fetchPurchaseHistory(50),
      ]);

      setTokenStats(stats);
      setPurchaseHistory(history?.purchases || []);
    } catch (error) {
      console.error("Failed to load billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  const formatNumber = (num) => num?.toLocaleString() || "0";
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCurrencySymbol = (currency) => {
    return currency === "USD" ? "$" : "৳";
  };

  const getCurrencyFlag = (currency) => {
    return currency === "USD" ? "🇺🇸" : "🇧🇩";
  };

  const getPaymentGatewayName = (gateway) => {
    return gateway === "stripe" ? "Stripe" : "SSLCommerz";
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  const currentBalance = tokenStats?.currentBalance || {};
  const usage = tokenStats?.usage || {};
  const expiry = tokenStats?.expiry || {};

  // Calculate usage percentage
  const totalTokensPurchased =
    currentBalance.paidTokens + (currentBalance.freeTokens || 50000);
  const usagePercentage =
    totalTokensPurchased > 0
      ? Math.round((usage.totalUsed / totalTokensPurchased) * 100)
      : 0;

  // Days until expiry
  const daysUntilExpiry = expiry.daysRemaining;
  const isExpiringSoon = expiry.isExpiringSoon;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Billing & Usage</h1>
            <p className="text-gray-600">
              Manage your tokens and view purchase history
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button
              onClick={() => router.push("/buy-tokens")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Buy Tokens
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Current Balance
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(currentBalance.totalTokens)}
                  </p>
                  <p className="text-xs text-gray-500">tokens</p>
                </div>
                <Coins className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Used
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(usage.totalUsed)}
                  </p>
                  <p className="text-xs text-gray-500">all time</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Last 30 Days
                  </p>
                  <p className="text-2xl font-bold">
                    {formatNumber(usage.last30Days)}
                  </p>
                  <p className="text-xs text-gray-500">tokens used</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Expires In
                  </p>
                  <p className="text-2xl font-bold">
                    {daysUntilExpiry !== null ? daysUntilExpiry : "∞"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {daysUntilExpiry !== null ? "days" : "never"}
                  </p>
                </div>
                <Clock
                  className={`w-8 h-8 ${
                    isExpiringSoon ? "text-red-500" : "text-gray-400"
                  }`}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Progress & Expiry Warning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="w-5 h-5" />
                <span>Token Usage</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Total Usage</span>
                  <span>{usagePercentage}%</span>
                </div>
                <Progress value={usagePercentage} className="h-2" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium">Free Tokens</p>
                  <p className="text-gray-600">
                    {currentBalance.freeTokens || 0} remaining
                  </p>
                </div>
                <div>
                  <p className="font-medium">Paid Tokens</p>
                  <p className="text-gray-600">
                    {formatNumber(currentBalance.paidTokens)} purchased
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Token Expiry</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {expiry.expiryDate ? (
                <>
                  <div className="flex items-center space-x-2">
                    {isExpiringLanoonSoon ? (
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    <span
                      className={`font-medium ${
                        isExpiringLanoonSoon ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {isExpiringLanoonSoon ? "Expiring Soon" : "Active"}
                    </span>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-medium">
                      {formatDate(expiry.expiryDate)}
                    </p>
                  </div>

                  {isExpiringLanoonSoon && (
                    <Button
                      onClick={() => router.push("/buy-tokens")}
                      size="sm"
                      className="w-full"
                    >
                      Extend Validity
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600">No paid tokens yet</p>
                  <Button
                    onClick={() => router.push("/buy-tokens")}
                    size="sm"
                    className="mt-2"
                  >
                    Buy Your First Tokens
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed views */}
        <Tabs defaultValue="history" className="space-y-6">
          <TabsList>
            <TabsTrigger value="history">Purchase History</TabsTrigger>
            <TabsTrigger value="usage">Usage Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Purchase History</span>
                </CardTitle>
                <CardDescription>
                  Your token purchase transactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {purchaseHistory.length > 0 ? (
                  <div className="space-y-4">
                    {purchaseHistory.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Coins className="w-5 h-5 text-blue-600" />
                          </div>

                          <div>
                            <p className="font-medium">
                              {formatNumber(purchase.tokenAmount)} tokens
                            </p>
                            <p className="text-sm text-gray-600">
                              {formatDate(purchase.purchaseDate)} •{" "}
                              {getPaymentGatewayName(purchase.paymentGateway)}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <span>{getCurrencyFlag(purchase.currency)}</span>
                            <p className="font-medium">
                              {getCurrencySymbol(purchase.currency)}
                              {formatNumber(purchase.totalPrice)}
                            </p>
                          </div>
                          <Badge
                            variant={
                              purchase.status === "completed"
                                ? "default"
                                : "secondary"
                            }
                            className="mt-1"
                          >
                            {purchase.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No purchases yet</p>
                    <Button
                      onClick={() => router.push("/buy-tokens")}
                      className="mt-4"
                    >
                      Make Your First Purchase
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Usage Analytics</span>
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of your token usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-4">Model Usage Breakdown</h4>
                    <div className="space-y-3">
                      {Object.entries(usage.modelBreakdown || {}).map(
                        ([model, tokens]) => (
                          <div
                            key={model}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm">{model}</span>
                            <Badge variant="outline">
                              {formatNumber(tokens)} tokens
                            </Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-4">Usage Statistics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Average Daily Usage</span>
                        <span className="font-medium">
                          {formatNumber(usage.averageDaily)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Total Messages</span>
                        <span className="font-medium">
                          {user?.messagesCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Member Since</span>
                        <span className="font-medium">
                          {formatDate(
                            user?.createdAt?.toDate?.()?.toISOString() ||
                              user?.createdAt
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BillingPage;
