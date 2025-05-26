"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import {
  ArrowLeft,
  Clock,
  Coins,
  CreditCard,
  Globe,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const BuyTokensPage = () => {
  const router = useRouter();
  const {
    user,
    tokens,
    preferredCurrency,
    updateUserTokens,
    fetchTokenBalance,
  } = useAuthStore();
  const { toast } = useToast();

  // State management
  const [selectedCurrency, setSelectedCurrency] = useState(
    preferredCurrency || "USD"
  );
  const [tokenAmount, setTokenAmount] = useState(500000); // Default 500K tokens
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);
  // Navigation helper
  const goToChat = () => {
    router.push("/chat");
  };
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [lastPurchase, setLastPurchase] = useState(null); // app/buy-tokens/page.js - Simple slider-based token purchase (no packages)

  // Constants
  const MIN_TOKENS = 10000;
  const MAX_TOKENS = 10000000;

  // Load initial pricing and auto-detect currency
  useEffect(() => {
    // Auto-detect currency based on user preference or location
    const detectedCurrency = detectUserCurrency();
    setSelectedCurrency(detectedCurrency);
  }, [preferredCurrency]);

  // Auto-detect user currency
  const detectUserCurrency = () => {
    // 1. User's saved preference
    if (preferredCurrency) return preferredCurrency;

    // 2. Browser/location detection
    if (typeof window !== "undefined") {
      const userLang = navigator.language || navigator.userLanguage;
      const userCountry = Intl.DateTimeFormat().resolvedOptions().timeZone;

      // Check for Bangladesh indicators
      if (
        userLang.includes("bn") ||
        userCountry.includes("Dhaka") ||
        userCountry.includes("Asia/Dhaka")
      ) {
        return "BDT";
      }
    }

    // 3. Default to USD
    return "USD";
  };

  // Calculate pricing when tokens or currency changes
  useEffect(() => {
    if (tokenAmount >= MIN_TOKENS) {
      calculatePrice(tokenAmount, selectedCurrency);
    }
  }, [tokenAmount, selectedCurrency]);

  const calculatePrice = async (tokens, currency) => {
    try {
      setLoading(true);
      const data = await apiClient.calculateTokenPrice(tokens, currency);
      setPricing(data);
    } catch (error) {
      console.error("Failed to calculate price:", error);
      toast({
        title: "Error",
        description: "Failed to calculate price",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCurrencyChange = (currency) => {
    setSelectedCurrency(currency);
  };

  const handleTokenAmountChange = (value) => {
    const amount = Math.max(
      MIN_TOKENS,
      Math.min(MAX_TOKENS, parseInt(value) || MIN_TOKENS)
    );
    setTokenAmount(amount);
  };

  const handlePurchase = () => {
    if (!pricing) return;

    setConfirmDialog({
      tokens: tokenAmount,
      price: pricing.totalPrice,
      currency: pricing.currency,
      symbol: pricing.symbol,
      paymentGateway: pricing.paymentGateway,
      pricing,
    });
  };

  const confirmPurchase = async () => {
    if (!confirmDialog) return;

    try {
      setPurchasing(true);

      const purchaseData = await apiClient.purchaseTokens(
        confirmDialog.tokens,
        confirmDialog.currency
      );

      // Update user tokens in store
      updateUserTokens(purchaseData.user.totalTokens);

      // Close dialog first
      setConfirmDialog(null);

      // Set success state
      setLastPurchase(purchaseData.purchase);
      setShowSuccessMessage(true);

      // Hide success message after 10 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 10000);

      // Show detailed success message
      toast({
        title: "🎉 Purchase Successful!",
        description: (
          <div className="space-y-2">
            <p className="font-medium">{purchaseData.message}</p>
            <div className="text-sm text-gray-600">
              <p>• {formatNumber(purchaseData.purchase.tokens)} tokens added</p>
              <p>• Valid for 30 days</p>
              {purchaseData.purchase.unlocksClaudeOpus && (
                <p>• 🚀 Claude Opus unlocked!</p>
              )}
            </div>
          </div>
        ),
        duration: 8000, // Show for 8 seconds
      });

      // Refresh token balance in background
      setTimeout(async () => {
        await fetchTokenBalance();
      }, 1000);
    } catch (error) {
      console.error("Purchase failed:", error);
      toast({
        title: "❌ Purchase Failed",
        description:
          error.message ||
          "Something went wrong with your purchase. Please try again.",
        variant: "destructive",
        duration: 6000,
      });
    } finally {
      setPurchasing(false);
    }
  };

  const formatNumber = (num) => num.toLocaleString();

  const getCurrencyFlag = (currency) => {
    return currency === "USD" ? "🇺🇸" : "🇧🇩";
  };

  const getPaymentMethods = (gateway) => {
    if (gateway === "stripe") {
      return "💳 Cards, PayPal, Apple Pay";
    }
    return "💳 Cards, 📱 bKash, Nagad, 🏦 Bank Transfer";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Back to Chat Button */}
          <div className="flex justify-start mb-6">
            <Button
              variant="outline"
              onClick={goToChat}
              className="flex items-center space-x-2 hover:bg-blue-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <MessageSquare className="w-4 h-4" />
              <span>Back to Chat</span>
            </Button>
          </div>

          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Buy AI Tokens
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Choose your token amount with our flexible pricing
          </p>

          {/* Current Balance */}
          <Card className="inline-block mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <Coins className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{formatNumber(tokens)}</p>
                  <p className="text-sm text-gray-600">Current Balance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        {showSuccessMessage && lastPurchase && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="text-6xl">🎉</div>
                <div>
                  <h2 className="text-2xl font-bold text-green-800 mb-2">
                    Purchase Successful!
                  </h2>
                  <p className="text-green-700 mb-4">
                    Your tokens have been added to your account and are ready to
                    use.
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 inline-block">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-bold text-2xl text-blue-600">
                        {formatNumber(lastPurchase.tokens)}
                      </p>
                      <p className="text-gray-600">Tokens Added</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-2xl text-purple-600">
                        {lastPurchase.symbol}
                        {formatNumber(lastPurchase.price)}
                      </p>
                      <p className="text-gray-600">Amount Paid</p>
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-2xl text-green-600">30</p>
                      <p className="text-gray-600">Days Valid</p>
                    </div>
                  </div>
                </div>

                {lastPurchase.unlocksClaudeOpus && (
                  <div className="bg-orange-100 rounded-lg p-3 border border-orange-200">
                    <p className="text-orange-800 font-medium">
                      🚀 <strong>Bonus:</strong> You've unlocked Claude Opus
                      access with {lastPurchase.claudeOpusLimit / 1000}K daily
                      limit!
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => setShowSuccessMessage(false)}
                  variant="outline"
                  size="sm"
                  className="mr-3"
                >
                  Got it, thanks!
                </Button>

                <Button
                  onClick={goToChat}
                  size="sm"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Start Chatting
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        <div className="flex justify-center mb-8">
          <Tabs
            value={selectedCurrency}
            onValueChange={handleCurrencyChange}
            className="w-auto"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="USD" className="flex items-center space-x-2">
                <span>🇺🇸</span>
                <span>USD ($)</span>
              </TabsTrigger>
              <TabsTrigger value="BDT" className="flex items-center space-x-2">
                <span>🇧🇩</span>
                <span>BDT (৳)</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Pricing Tiers Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center space-x-2">
              <span>🚀 Flexible Token Packages</span>
            </CardTitle>
            <CardDescription className="text-center">
              Choose the perfect amount for your AI needs - Better value with
              larger purchases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2">Token Range</th>
                    <th className="text-left py-3 px-2">Price per 1K</th>
                    <th className="text-left py-3 px-2">Example Price</th>
                    <th className="text-left py-3 px-2">Savings</th>
                    <th className="text-left py-3 px-2">Claude Opus</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b hover:bg-blue-50">
                    <td className="py-3 px-2 font-medium">10K - 99K</td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-blue-600">
                        ${selectedCurrency === "USD" ? "0.020" : "৳2.40"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold">
                        50K = ${selectedCurrency === "USD" ? "1.00" : "৳120"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="outline">Standard Rate</Badge>
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      ❌ Not available
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-green-50">
                    <td className="py-3 px-2 font-medium">100K - 299K</td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-green-600">
                        ${selectedCurrency === "USD" ? "0.019" : "৳2.28"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold">
                        200K = ${selectedCurrency === "USD" ? "3.80" : "৳456"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        5% savings
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-gray-500">
                      ❌ Not available
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-orange-50 bg-orange-50">
                    <td className="py-3 px-2 font-medium">300K - 999K</td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-orange-600">
                        ${selectedCurrency === "USD" ? "0.018" : "৳2.16"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold">
                        500K = ${selectedCurrency === "USD" ? "9.00" : "৳1,080"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge className="bg-orange-500 text-white">
                        10% savings
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-orange-600 font-medium">
                        ✅ 25K/day
                      </span>
                    </td>
                  </tr>
                  <tr className="border-b hover:bg-purple-50">
                    <td className="py-3 px-2 font-medium">1M - 4.9M</td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-purple-600">
                        ${selectedCurrency === "USD" ? "0.017" : "৳2.04"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold">
                        2M = ${selectedCurrency === "USD" ? "34.00" : "৳4,080"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge className="bg-purple-500 text-white">
                        15% savings
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-purple-600 font-medium">
                        ✅ 75K/day
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-indigo-50">
                    <td className="py-3 px-2 font-medium">5M+</td>
                    <td className="py-3 px-2">
                      <span className="font-medium text-indigo-600">
                        ${selectedCurrency === "USD" ? "0.0165" : "৳1.98"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <span className="font-bold">
                        10M = $
                        {selectedCurrency === "USD" ? "165.00" : "৳19,800"}
                      </span>
                    </td>
                    <td className="py-3 px-2">
                      <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
                        18% savings
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <span className="text-indigo-600 font-medium">
                        ✅ 150K/day
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">
                  💰 Why Choose NimbaAI?
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>
                    • <strong>Competitive pricing</strong> - Great value for AI
                    access
                  </li>
                  <li>
                    • <strong>Volume discounts</strong> - Save more with larger
                    purchases
                  </li>
                  <li>
                    • <strong>No hidden fees</strong> - What you see is what you
                    pay
                  </li>
                  <li>
                    • <strong>Flexible usage</strong> - 30 days to use your
                    tokens
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <h4 className="font-medium text-orange-800 mb-2">
                  🚀 Premium Features
                </h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>
                    • <strong>Claude Opus access</strong> - Starting at 300K+
                    tokens
                  </li>
                  <li>
                    • <strong>All AI models</strong> - GPT-4, Claude, and more
                  </li>
                  <li>
                    • <strong>Priority support</strong> - Get help when you need
                    it
                  </li>
                  <li>
                    • <strong>Usage analytics</strong> - Track your AI
                    consumption
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="w-5 h-5" />
              <span>Choose Token Amount</span>
            </CardTitle>
            <CardDescription>
              Select any amount between {formatNumber(MIN_TOKENS)} and{" "}
              {formatNumber(MAX_TOKENS)} tokens
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Token Amount Input */}
            <div>
              <Label htmlFor="token-amount">Token Amount</Label>
              <div className="mt-2">
                <Input
                  id="token-amount"
                  type="number"
                  value={tokenAmount}
                  onChange={(e) => handleTokenAmountChange(e.target.value)}
                  min={MIN_TOKENS}
                  max={MAX_TOKENS}
                  step="10000"
                  className="text-lg text-center"
                />
              </div>
            </div>

            {/* Token Slider */}
            <div>
              <input
                type="range"
                min={MIN_TOKENS}
                max={MAX_TOKENS}
                step="10000"
                value={tokenAmount}
                onChange={(e) => handleTokenAmountChange(e.target.value)}
                className="w-full h-3 bg-gradient-to-r from-blue-200 to-purple-200 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #3B82F6 0%, #8B5CF6 ${
                    ((tokenAmount - MIN_TOKENS) / (MAX_TOKENS - MIN_TOKENS)) *
                    100
                  }%, #E5E7EB ${
                    ((tokenAmount - MIN_TOKENS) / (MAX_TOKENS - MIN_TOKENS)) *
                    100
                  }%, #E5E7EB 100%)`,
                }}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>{formatNumber(MIN_TOKENS)}</span>
                <span>
                  {formatNumber(Math.floor((MIN_TOKENS + MAX_TOKENS) / 2))}
                </span>
                <span>{formatNumber(MAX_TOKENS)}</span>
              </div>
            </div>

            {/* Pricing Display */}
            {pricing && !loading && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardContent className="pt-6">
                  {/* Main Pricing Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-6">
                    <div>
                      <p className="text-3xl font-bold text-blue-600">
                        {formatNumber(tokenAmount)}
                      </p>
                      <p className="text-sm text-gray-600">Tokens</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-purple-600">
                        {pricing.symbol}
                        {formatNumber(pricing.totalPrice)}
                      </p>
                      <p className="text-sm text-gray-600">
                        Total Price ({pricing.currency})
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {pricing.symbol}
                        {pricing.pricePerThousand} per 1K tokens
                      </p>
                      {pricing.volumeDiscount > 0 && (
                        <Badge
                          variant="secondary"
                          className="mt-1 bg-green-100 text-green-700"
                        >
                          {pricing.volumeDiscount}% volume savings
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Button
                        onClick={handlePurchase}
                        size="lg"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        disabled={loading}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Purchase Now
                      </Button>
                    </div>
                  </div>

                  {/* Tier Information */}
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-center space-x-2 mb-3">
                      <Badge
                        variant={
                          pricing.unlocksClaudeOpus ? "default" : "secondary"
                        }
                        className={
                          pricing.unlocksClaudeOpus
                            ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                            : ""
                        }
                      >
                        {pricing.tier}
                      </Badge>
                      {pricing.unlocksClaudeOpus && (
                        <Badge
                          variant="outline"
                          className="border-orange-500 text-orange-600"
                        >
                          🚀 Claude Opus ({pricing.claudeOpusLimit / 1000}K/day)
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700 mb-2">
                          What you get:
                        </p>
                        <ul className="space-y-1">
                          {pricing.benefits.map((benefit, index) => (
                            <li
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <span className="text-green-500">✓</span>
                              <span
                                className={
                                  benefit.includes("Claude Opus")
                                    ? "text-orange-600 font-medium"
                                    : "text-gray-600"
                                }
                              >
                                {benefit}
                              </span>
                            </li>
                          ))}
                        </ul>
                        {pricing.notes && (
                          <p className="text-xs text-blue-600 font-medium mt-2">
                            💡 {pricing.notes}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-700 mb-2">
                          Purchase details:
                        </p>
                        <div className="space-y-1 text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-green-500" />
                            <span>Valid for 30 days</span>
                          </div>
                          <div className="text-xs">
                            {getPaymentMethods(pricing.paymentGateway)}
                          </div>
                          {pricing.unlocksClaudeOpus && (
                            <>
                              <div className="text-xs text-orange-600 font-medium">
                                🎯 Unlock Claude Opus with{" "}
                                {pricing.claudeOpusLimit / 1000}K daily access
                              </div>
                              <div className="text-xs text-blue-600">
                                💎 Premium AI models included - Great value!
                              </div>
                            </>
                          )}
                          {!pricing.unlocksClaudeOpus && (
                            <div className="text-xs text-blue-600">
                              🚀 Affordable AI access - Perfect for getting
                              started!
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Calculating price...</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Info */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <Globe className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                <h3 className="font-semibold mb-2">Global Payments (USD)</h3>
                <p className="text-sm text-gray-600 mb-2">
                  💳 Credit Cards, PayPal, Apple Pay, Google Pay
                </p>
                <Badge variant="outline">Powered by Stripe</Badge>
              </div>

              <div className="text-center">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <h3 className="font-semibold mb-2">
                  Bangladesh Payments (BDT)
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  📱 bKash, Nagad 💳 Cards 🏦 Bank Transfer
                </p>
                <Badge variant="outline">Powered by SSLCommerz</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Purchase Confirmation Dialog */}
      <AlertDialog
        open={!!confirmDialog}
        onOpenChange={() => setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Token Purchase</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Tokens:</p>
                      <p className="text-xl font-bold">
                        {confirmDialog?.tokens?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Price:</p>
                      <p className="text-xl font-bold">
                        {confirmDialog?.symbol}
                        {confirmDialog?.price?.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Currency:</p>
                      <p>
                        {getCurrencyFlag(confirmDialog?.currency)}{" "}
                        {confirmDialog?.currency}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Tier:</p>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            confirmDialog?.unlocksClaudeOpus
                              ? "default"
                              : "secondary"
                          }
                        >
                          {confirmDialog?.tier}
                        </Badge>
                        {confirmDialog?.unlocksClaudeOpus && (
                          <span className="text-xs text-orange-600 font-medium">
                            🚀 Claude Opus
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600">
                  {confirmDialog?.currency === "USD"
                    ? "Payment will be processed via Stripe with global payment methods."
                    : "Payment will be processed via SSLCommerz with local Bangladesh payment methods."}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={purchasing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmPurchase}
              disabled={purchasing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {purchasing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Confirm Purchase
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6);
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  );
};

export default BuyTokensPage;
