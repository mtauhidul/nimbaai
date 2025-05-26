// backend/routes/billing.js - Complete dual currency token purchase system (FIXED)
const express = require("express");
const { db, FieldValue } = require("../services/firebase-admin");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// DUAL CURRENCY PRICING CONFIGURATION
const CURRENCY_CONFIG = {
  USD: {
    symbol: "$",
    name: "USD",
    paymentGateway: "stripe",
    exchangeRate: 1, // Base currency
  },
  BDT: {
    symbol: "৳",
    name: "BDT",
    paymentGateway: "sslcommerz",
    exchangeRate: 120, // 1 USD = 120 BDT (adjust as needed)
  },
};

// NEW PRICING STRATEGY - 25% Margin on $0.015 per 1K token backend cost
const getTokenPriceUSD = (tokenAmount) => {
  if (tokenAmount <= 99999) return 0.02; // $0.020 per 1K tokens (~33% margin)
  if (tokenAmount <= 299999) return 0.019; // $0.019 per 1K tokens (~27% margin)
  if (tokenAmount <= 999999) return 0.018; // $0.018 per 1K tokens (~20% margin)
  if (tokenAmount <= 4999999) return 0.017; // $0.017 per 1K tokens (~13% margin)
  if (tokenAmount >= 5000000) return 0.0165; // $0.0165 per 1K tokens (~10% margin)
  return 0.02; // Default to starter tier
};

// Auto-detect currency based on user location/preference
const detectUserCurrency = (userCountry, preferredCurrency) => {
  if (preferredCurrency) return preferredCurrency;
  if (userCountry === "BD" || userCountry === "Bangladesh") return "BDT";
  return "USD"; // Default to USD for global users
};

// Get tier benefits with Claude Opus throttling for sustainability
const getTierBenefits = (tokenAmount) => {
  if (tokenAmount <= 99999) {
    return {
      tier: "Starter",
      benefits: [
        "GPT-3.5 Turbo",
        "GPT-4 Turbo",
        "Claude Haiku & Sonnet",
        "Standard support",
      ],
      unlocksClaudeOpus: false,
      claudeOpusLimit: null,
      notes: "Affordable entry point",
    };
  }
  if (tokenAmount <= 299999) {
    return {
      tier: "Frequent User",
      benefits: ["All basic models", "Standard support", "5% volume discount"],
      unlocksClaudeOpus: false,
      claudeOpusLimit: null,
      notes: "Better value for regular users",
    };
  }
  if (tokenAmount <= 999999) {
    return {
      tier: "Power User",
      benefits: [
        "All AI models",
        "Claude Opus access",
        "Priority support",
        "25K Opus daily limit",
        "10% volume discount",
      ],
      unlocksClaudeOpus: true,
      claudeOpusLimit: 25000, // 25K tokens per day for sustainability
      notes: "Professional tier with Claude Opus",
    };
  }
  if (tokenAmount <= 4999999) {
    return {
      tier: "Professional",
      benefits: [
        "All AI models",
        "Claude Opus access",
        "Priority support",
        "75K Opus daily limit",
        "Usage analytics",
        "15% volume discount",
      ],
      unlocksClaudeOpus: true,
      claudeOpusLimit: 75000, // 75K tokens per day
      notes: "High-volume professional tier",
    };
  }
  if (tokenAmount >= 5000000) {
    return {
      tier: "Enterprise",
      benefits: [
        "All AI models",
        "Claude Opus access",
        "VIP support",
        "150K Opus daily limit",
        "Team features",
        "API access",
        "18% volume discount",
      ],
      unlocksClaudeOpus: true,
      claudeOpusLimit: 150000, // 150K tokens per day
      notes: "Maximum value enterprise tier",
    };
  }
  return getTierBenefits(99999); // Default
};

// Calculate price in any currency with 25% margin strategy
const calculateTokenPrice = (tokenAmount, currency = "USD") => {
  const pricePerThousandUSD = getTokenPriceUSD(tokenAmount);
  const totalUSD = (tokenAmount / 1000) * pricePerThousandUSD;

  if (currency === "USD") {
    return {
      pricePerThousand: pricePerThousandUSD,
      totalPrice: Math.round(totalUSD * 100) / 100, // Round to 2 decimal places
      currency: "USD",
      symbol: "$",
      paymentGateway: "stripe",
      backendCost: (tokenAmount / 1000) * 0.015, // Show backend cost for transparency
      profitMargin: Math.round(((pricePerThousandUSD - 0.015) / 0.015) * 100), // Calculate actual margin %
      ...getTierBenefits(tokenAmount),
    };
  }

  if (currency === "BDT") {
    const exchangeRate = CURRENCY_CONFIG.BDT.exchangeRate; // 120 BDT = 1 USD
    const pricePerThousandBDT = pricePerThousandUSD * exchangeRate;
    const totalBDT = totalUSD * exchangeRate;

    return {
      pricePerThousand: pricePerThousandBDT,
      totalPrice: Math.round(totalBDT), // Round BDT to whole numbers
      currency: "BDT",
      symbol: "৳",
      paymentGateway: "sslcommerz",
      backendCost: (tokenAmount / 1000) * 0.015 * exchangeRate, // Backend cost in BDT
      profitMargin: Math.round(((pricePerThousandUSD - 0.015) / 0.015) * 100), // Same margin %
      ...getTierBenefits(tokenAmount),
    };
  }

  throw new Error("Unsupported currency");
};

// GET /api/billing/calculate-price - Calculate price with 25% margin strategy
router.get("/calculate-price", authenticateUser, async (req, res) => {
  try {
    const { tokens, currency = "USD" } = req.query;

    const tokenAmount = parseInt(tokens);
    if (!tokenAmount || tokenAmount < 10000) {
      return res.status(400).json({
        message: "Minimum token amount is 10,000",
      });
    }

    if (tokenAmount > 10000000) {
      return res.status(400).json({
        message: "Maximum token amount is 10,000,000",
      });
    }

    const pricing = calculateTokenPrice(tokenAmount, currency);

    // Calculate volume discount percentage
    const basePrice = getTokenPriceUSD(10000); // Base price for comparison
    const currentPrice =
      pricing.pricePerThousand /
      (currency === "BDT" ? CURRENCY_CONFIG.BDT.exchangeRate : 1);
    const volumeDiscount = Math.round(
      ((basePrice - currentPrice) / basePrice) * 100
    );

    res.json({
      tokens: tokenAmount,
      ...pricing,
      validity: "30 days",
      minTokens: 10000,
      maxTokens: 10000000,
      volumeDiscount: volumeDiscount > 0 ? volumeDiscount : 0,
      backendCostTransparency: {
        ourCost: pricing.backendCost,
        yourPrice: pricing.totalPrice,
        margin: `${pricing.profitMargin}%`,
      },
    });
  } catch (error) {
    console.error("Price calculation error:", error);
    res.status(400).json({ message: error.message });
  }
});

// POST /api/billing/purchase-tokens - Purchase tokens with slider amount
router.post("/purchase-tokens", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { tokens, currency = "USD", paymentMethod = "mock" } = req.body;

    // Validate input
    const tokenAmount = parseInt(tokens);
    if (!tokenAmount || tokenAmount < 10000) {
      return res.status(400).json({
        message: "Minimum token amount is 10,000",
      });
    }

    if (tokenAmount > 10000000) {
      return res.status(400).json({
        message: "Maximum token amount is 10,000,000",
      });
    }

    // Calculate pricing
    const pricing = calculateTokenPrice(tokenAmount, currency);

    // Get user data
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // Mock payment processing delay (3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Generate mock transaction ID
    const transactionId = `mock_${currency.toLowerCase()}_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Calculate new token balance and expiry
    const currentTokens = userData.tokens || 0;
    const newTokenBalance = currentTokens + tokenAmount;
    const purchaseDate = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days validity

    // Update user tokens
    await db
      .collection("users")
      .doc(userId)
      .update({
        tokens: newTokenBalance,
        paidTokens: (userData.paidTokens || 0) + tokenAmount,
        tokenPurchaseDate: purchaseDate,
        tokenExpiryDate: expiryDate,
        totalSpent: (userData.totalSpent || 0) + pricing.totalPrice,
        updatedAt: new Date(),

        // Store currency preference
        preferredCurrency: currency,
        lastPurchaseCurrency: currency,
      });

    // Record purchase transaction
    const purchaseRecord = {
      userId,
      tokenAmount,
      pricePerThousand: pricing.pricePerThousand,
      totalPrice: pricing.totalPrice,
      currency,
      tier: pricing.tier,
      unlocksClaudeOpus: pricing.unlocksClaudeOpus,
      claudeOpusLimit: pricing.claudeOpusLimit,
      paymentGateway: pricing.paymentGateway,
      paymentMethod: "mock", // Will be "stripe" or "sslcommerz" in production
      transactionId,
      status: "completed",
      purchaseDate,
      expiryDate,

      // Additional metadata
      userEmail: req.user.email,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    };

    await db.collection("tokenPurchases").add(purchaseRecord);

    // Update user's Claude Opus access and limits if unlocked
    if (pricing.unlocksClaudeOpus) {
      await db.collection("users").doc(userId).update({
        hasClaudeOpusAccess: true,
        claudeOpusUnlockedAt: purchaseDate,
        claudeOpusDailyLimit: pricing.claudeOpusLimit,
        claudeOpusUsageToday: 0, // Reset daily usage counter
        claudeOpusLastResetDate: purchaseDate,
      });
    }

    // Log for analytics
    await db.collection("analytics").add({
      event: "token_purchase",
      userId,
      currency,
      tokenAmount,
      totalPrice: pricing.totalPrice,
      tier: pricing.tier,
      paymentGateway: pricing.paymentGateway,
      timestamp: new Date(),
    });

    console.log(
      `💰 Token purchase: ${tokenAmount} tokens for ${pricing.symbol}${pricing.totalPrice} (${currency}) - User: ${req.user.email}`
    );

    res.json({
      success: true,
      message: `Successfully purchased ${tokenAmount.toLocaleString()} tokens for ${
        pricing.symbol
      }${pricing.totalPrice.toLocaleString()} via ${pricing.paymentGateway}`,
      purchase: {
        tokens: tokenAmount,
        price: pricing.totalPrice,
        currency,
        symbol: pricing.symbol,
        paymentGateway: pricing.paymentGateway,
        transactionId,
        validity: "30 days",
        expiryDate: expiryDate.toISOString(),
        tier: pricing.tier,
        unlocksClaudeOpus: pricing.unlocksClaudeOpus,
        claudeOpusLimit: pricing.claudeOpusLimit,
      },
      user: {
        totalTokens: newTokenBalance,
        paidTokens: (userData.paidTokens || 0) + tokenAmount,
        preferredCurrency: currency,
        hasClaudeOpusAccess:
          pricing.unlocksClaudeOpus || userData.hasClaudeOpusAccess,
      },
    });
  } catch (error) {
    console.error("Token purchase error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process token purchase",
      error: error.message,
    });
  }
});

// GET /api/billing/purchase-history - Get user's token purchase history
router.get("/purchase-history", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { limit = 20 } = req.query;

    const purchaseSnapshot = await db
      .collection("tokenPurchases")
      .where("userId", "==", userId)
      .orderBy("purchaseDate", "desc")
      .limit(parseInt(limit))
      .get();

    const purchases = purchaseSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      purchaseDate: doc.data().purchaseDate?.toDate()?.toISOString(),
      expiryDate: doc.data().expiryDate?.toDate()?.toISOString(),
    }));

    // Calculate totals
    const totalSpent = purchases.reduce((sum, purchase) => {
      if (purchase.currency === "USD") {
        return sum + purchase.totalPrice;
      } else if (purchase.currency === "BDT") {
        // Convert BDT to USD for total calculation
        return sum + purchase.totalPrice / CURRENCY_CONFIG.BDT.exchangeRate;
      }
      return sum;
    }, 0);

    const totalTokensPurchased = purchases.reduce(
      (sum, purchase) => sum + purchase.tokenAmount,
      0
    );

    res.json({
      purchases,
      summary: {
        totalPurchases: purchases.length,
        totalTokensPurchased,
        totalSpentUSD: Math.round(totalSpent * 100) / 100,
        preferredCurrency: purchases[0]?.currency || "USD",
        lastPurchase: purchases[0] || null,
      },
    });
  } catch (error) {
    console.error("Purchase history error:", error);
    res.status(500).json({ message: "Failed to get purchase history" });
  }
});

module.exports = router;
