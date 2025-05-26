// backend/routes/admin.js
const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const { db } = require("../services/firebase-admin");

const router = express.Router();

// Admin emails - in production, store this in environment variables or database
const ADMIN_EMAILS = ["admin@nimbaai.com", process.env.ADMIN_EMAIL].filter(
  Boolean
);

// Admin middleware
const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if user email is in admin list
    if (!ADMIN_EMAILS.includes(req.user.email)) {
      return res.status(403).json({ message: "Admin access required" });
    }

    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Helper function to safely convert Firestore timestamps
const safeTimestamp = (timestamp) => {
  if (!timestamp) return null;
  if (timestamp.toDate) return timestamp.toDate();
  if (timestamp instanceof Date) return timestamp;
  return new Date(timestamp);
};

// Dashboard Overview Statistics
router.get("/dashboard", authenticateUser, requireAdmin, async (req, res) => {
  try {
    // Get all users
    const usersSnapshot = await db.collection("users").get();
    const users = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName,
        emailVerified: data.emailVerified || false,
        tokenBalance: data.tokenBalance || 0,
        tokensUsed: data.tokensUsed || 0,
        tokensPurchased: data.tokensPurchased || 0,
        freeTokensGranted: data.freeTokensGranted || 0,
        claudeOpusAccess: data.claudeOpusAccess || false,
        createdAt: safeTimestamp(data.createdAt),
        lastActive: safeTimestamp(data.lastActive),
        provider: data.provider || "email",
      });
    });

    // Get all purchases
    const purchasesSnapshot = await db.collection("purchases").get();
    const purchases = [];

    purchasesSnapshot.forEach((doc) => {
      const data = doc.data();
      purchases.push({
        id: doc.id,
        userId: data.userId,
        userEmail: data.userEmail,
        amount: data.amount || 0,
        currency: data.currency,
        tokens: data.tokens || 0,
        createdAt: safeTimestamp(data.createdAt),
      });
    });

    // Get all conversations
    const conversationsSnapshot = await db.collection("conversations").get();
    const conversations = [];

    conversationsSnapshot.forEach((doc) => {
      const data = doc.data();
      conversations.push({
        id: doc.id,
        userId: data.userId,
        messageCount: data.messageCount || 0,
        tokensUsed: data.tokensUsed || 0,
        createdAt: safeTimestamp(data.createdAt),
        updatedAt: safeTimestamp(data.updatedAt),
      });
    });

    // Calculate statistics
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // User statistics
    const totalUsers = users.length;
    const verifiedUsers = users.filter((u) => u.emailVerified).length;
    const newUsersToday = users.filter(
      (u) => u.createdAt && u.createdAt >= today
    ).length;
    const activeUsers = users.filter(
      (u) => u.lastActive && u.lastActive >= sevenDaysAgo
    ).length;

    // Token statistics
    const totalTokensGranted = users.reduce(
      (sum, u) => sum + u.freeTokensGranted,
      0
    );
    const totalTokensPurchased = users.reduce(
      (sum, u) => sum + u.tokensPurchased,
      0
    );
    const totalTokensUsed = users.reduce((sum, u) => sum + u.tokensUsed, 0);
    const totalTokensRemaining = users.reduce(
      (sum, u) => sum + u.tokenBalance,
      0
    );

    // Revenue statistics
    const usdPurchases = purchases.filter((p) => p.currency === "USD");
    const bdtPurchases = purchases.filter((p) => p.currency === "BDT");
    const totalRevenueUSD = usdPurchases.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenueBDT = bdtPurchases.reduce((sum, p) => sum + p.amount, 0);

    // Usage statistics
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce(
      (sum, c) => sum + c.messageCount,
      0
    );

    // Recent activity
    const recentUsers = users
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);

    const recentPurchases = purchases
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);

    res.json({
      userStats: {
        totalUsers,
        verifiedUsers,
        newUsersToday,
        activeUsers,
      },
      tokenStats: {
        totalTokensGranted,
        totalTokensPurchased,
        totalTokensUsed,
        totalTokensRemaining,
        averageTokensPerUser:
          totalUsers > 0 ? Math.round(totalTokensRemaining / totalUsers) : 0,
      },
      revenueStats: {
        totalPurchases: purchases.length,
        totalRevenueUSD: Math.round(totalRevenueUSD * 100) / 100,
        totalRevenueBDT: Math.round(totalRevenueBDT),
        usdPurchases: usdPurchases.length,
        bdtPurchases: bdtPurchases.length,
        averagePurchaseUSD:
          usdPurchases.length > 0
            ? Math.round((totalRevenueUSD / usdPurchases.length) * 100) / 100
            : 0,
        averagePurchaseBDT:
          bdtPurchases.length > 0
            ? Math.round(totalRevenueBDT / bdtPurchases.length)
            : 0,
      },
      usageStats: {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation:
          totalConversations > 0
            ? Math.round(totalMessages / totalConversations)
            : 0,
      },
      recentActivity: {
        recentUsers: recentUsers.slice(0, 5),
        recentPurchases: recentPurchases.slice(0, 5),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
});

// User Management - Get all users with pagination
router.get("/users", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";
    const filter = req.query.filter || "all";

    const usersSnapshot = await db.collection("users").get();
    let users = [];

    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        email: data.email,
        displayName: data.displayName || "N/A",
        emailVerified: data.emailVerified || false,
        tokenBalance: data.tokenBalance || 0,
        tokensUsed: data.tokensUsed || 0,
        tokensPurchased: data.tokensPurchased || 0,
        freeTokensGranted: data.freeTokensGranted || 0,
        claudeOpusAccess: data.claudeOpusAccess || false,
        createdAt: safeTimestamp(data.createdAt),
        lastActive: safeTimestamp(data.lastActive),
        provider: data.provider || "email",
        photoURL: data.photoURL,
      });
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchLower) ||
          user.displayName?.toLowerCase().includes(searchLower)
      );
    }

    // Apply verification filter
    if (filter === "verified") {
      users = users.filter((user) => user.emailVerified);
    } else if (filter === "unverified") {
      users = users.filter((user) => !user.emailVerified);
    }

    // Sort by creation date (newest first)
    users.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    // Pagination
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    res.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1,
      },
      filters: { search, filter },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res
      .status(500)
      .json({ message: "Error fetching users", error: error.message });
  }
});

// Get single user details
router.get(
  "/users/:userId",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;

      // Get user data
      const userDoc = await db.collection("users").doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const userData = { id: userDoc.id, ...userDoc.data() };

      // Get user's purchases
      const purchasesSnapshot = await db
        .collection("purchases")
        .where("userId", "==", userId)
        .get();

      const purchases = [];
      purchasesSnapshot.forEach((doc) => {
        purchases.push({ id: doc.id, ...doc.data() });
      });

      // Get user's conversations
      const conversationsSnapshot = await db
        .collection("conversations")
        .where("userId", "==", userId)
        .limit(10)
        .get();

      const conversations = [];
      conversationsSnapshot.forEach((doc) => {
        const data = doc.data();
        conversations.push({
          id: doc.id,
          title: data.title || "Untitled",
          messageCount: data.messageCount || 0,
          createdAt: safeTimestamp(data.createdAt),
          updatedAt: safeTimestamp(data.updatedAt),
        });
      });

      // Calculate user statistics
      const totalSpent = purchases.reduce((sum, p) => {
        if (p.currency === "USD") return sum + (p.amount || 0);
        if (p.currency === "BDT") return sum + (p.amount || 0) / 85; // Rough USD conversion
        return sum;
      }, 0);

      res.json({
        user: userData,
        purchases,
        conversations,
        stats: {
          totalPurchases: purchases.length,
          totalSpentUSD: Math.round(totalSpent * 100) / 100,
          totalConversations: conversations.length,
          tokenUtilization:
            userData.tokensUsed && userData.tokenBalance
              ? Math.round(
                  (userData.tokensUsed /
                    (userData.tokensUsed + userData.tokenBalance)) *
                    100
                )
              : 0,
        },
      });
    } catch (error) {
      console.error("Get user details error:", error);
      res
        .status(500)
        .json({ message: "Error fetching user details", error: error.message });
    }
  }
);

// Update user tokens
router.put(
  "/users/:userId/tokens",
  authenticateUser,
  requireAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { action, amount, reason } = req.body;

      if (!["add", "subtract", "set"].includes(action)) {
        return res
          .status(400)
          .json({ message: "Invalid action. Use add, subtract, or set" });
      }

      if (!amount || amount < 0) {
        return res
          .status(400)
          .json({ message: "Amount must be a positive number" });
      }

      const userRef = db.collection("users").doc(userId);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        return res.status(404).json({ message: "User not found" });
      }

      const currentBalance = userDoc.data().tokenBalance || 0;
      let newBalance;

      switch (action) {
        case "add":
          newBalance = currentBalance + amount;
          break;
        case "subtract":
          newBalance = Math.max(0, currentBalance - amount);
          break;
        case "set":
          newBalance = amount;
          break;
      }

      await userRef.update({
        tokenBalance: newBalance,
        updatedAt: new Date(),
      });

      // Log the admin action
      await db.collection("adminActions").add({
        adminId: req.user.uid,
        adminEmail: req.user.email,
        action: "update_tokens",
        targetUserId: userId,
        details: {
          action,
          amount,
          previousBalance: currentBalance,
          newBalance,
          reason: reason || "Admin adjustment",
        },
        createdAt: new Date(),
      });

      res.json({
        message: "User tokens updated successfully",
        previousBalance: currentBalance,
        newBalance,
      });
    } catch (error) {
      console.error("Update user tokens error:", error);
      res
        .status(500)
        .json({ message: "Error updating user tokens", error: error.message });
    }
  }
);

// System Settings - Get current settings
router.get("/settings", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const settingsDoc = await db.collection("settings").doc("system").get();
    const settings = settingsDoc.exists ? settingsDoc.data() : {};

    const defaultSettings = {
      freeTokens: 50000,
      maintenanceMode: false,
      enabledModels: {
        "gpt-3.5-turbo": true,
        "gpt-4": true,
        "gpt-4-turbo": true,
        "claude-3-haiku": true,
        "claude-3-sonnet": true,
        "claude-3-opus": true,
      },
      claudeOpusRequirement: 300000,
      systemAnnouncement: "",
      rateLimits: {
        messagesPerHour: 100,
        tokensPerHour: 10000,
      },
    };

    res.json({ ...defaultSettings, ...settings });
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({
      message: "Error fetching system settings",
      error: error.message,
    });
  }
});

// System Settings - Update settings
router.put("/settings", authenticateUser, requireAdmin, async (req, res) => {
  try {
    const updates = req.body;

    await db.collection("settings").doc("system").set(updates, { merge: true });

    // Log the admin action
    await db.collection("adminActions").add({
      adminId: req.user.uid,
      adminEmail: req.user.email,
      action: "update_settings",
      details: updates,
      createdAt: new Date(),
    });

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({
      message: "Error updating system settings",
      error: error.message,
    });
  }
});

module.exports = router;
