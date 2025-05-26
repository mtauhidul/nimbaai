// backend/routes/auth.js - Updated with token system and email verification
const express = require("express");
const { db } = require("../services/firebase-admin");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// Constants
const FREE_TOKENS_AMOUNT = 50000; // 50,000 free tokens on signup
const MIN_TOKENS_FOR_CHAT = 100; // Minimum tokens needed to send a message

// Verify token and get user data
router.get("/verify", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const userEmail = req.user.email;
    const isEmailVerified = req.user.email_verified;

    console.log(
      `🔐 Verifying user: ${userId}, email: ${userEmail}, verified: ${isEmailVerified}`
    );

    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      // Create new user document with token system
      const newUser = {
        uid: userId,
        email: userEmail,
        displayName: req.user.name || userEmail.split("@")[0],

        // TOKEN SYSTEM - Replace credits with tokens
        tokens: 0, // Start with 0 tokens
        freeTokensGranted: false, // Track if free tokens have been given

        // Email verification tracking
        emailVerified: isEmailVerified,
        emailVerifiedAt: isEmailVerified ? new Date() : null,

        // Legacy fields (keep for backward compatibility)
        credits: 0, // Deprecated but keep for migration
        subscription: null,

        // Analytics and tracking
        createdAt: new Date(),
        updatedAt: new Date(),
        totalTokensUsed: 0,
        totalSpent: 0,
        messagesCount: 0,

        // Usage tracking
        lastActiveAt: new Date(),
        signupSource: "web", // Track how they signed up
      };

      // Grant free tokens immediately if email is verified
      if (isEmailVerified && !newUser.freeTokensGranted) {
        newUser.tokens = FREE_TOKENS_AMOUNT;
        newUser.freeTokensGranted = true;
        newUser.freeTokensGrantedAt = new Date();

        console.log(
          `🎁 Granted ${FREE_TOKENS_AMOUNT} free tokens to verified user: ${userEmail}`
        );
      }

      await db.collection("users").doc(userId).set(newUser);

      console.log(
        `👤 Created new user: ${userId} with ${newUser.tokens} tokens`
      );

      return res.json({
        user: newUser,
        isNewUser: true,
        needsEmailVerification: !isEmailVerified,
        freeTokensAvailable: !newUser.freeTokensGranted,
      });
    }

    const userData = userDoc.data();

    // Check if we need to grant free tokens to existing user
    let updatedUser = { ...userData };
    let needsUpdate = false;

    // Grant free tokens if email just got verified and tokens haven't been granted
    if (
      isEmailVerified &&
      !userData.emailVerified &&
      !userData.freeTokensGranted
    ) {
      updatedUser.tokens = (userData.tokens || 0) + FREE_TOKENS_AMOUNT;
      updatedUser.freeTokensGranted = true;
      updatedUser.freeTokensGrantedAt = new Date();
      updatedUser.emailVerified = true;
      updatedUser.emailVerifiedAt = new Date();
      needsUpdate = true;

      console.log(
        `🎁 Granted ${FREE_TOKENS_AMOUNT} free tokens to newly verified user: ${userEmail}`
      );
    }

    // Update email verification status if changed
    if (isEmailVerified !== userData.emailVerified) {
      updatedUser.emailVerified = isEmailVerified;
      if (isEmailVerified && !userData.emailVerifiedAt) {
        updatedUser.emailVerifiedAt = new Date();
      }
      needsUpdate = true;
    }

    // Update last active time
    updatedUser.lastActiveAt = new Date();
    updatedUser.updatedAt = new Date();
    needsUpdate = true;

    // Migrate from credits to tokens if needed (backward compatibility)
    if (userData.credits && userData.credits > 0 && !userData.tokens) {
      // Convert credits to tokens (1 credit = 1000 tokens as rough conversion)
      updatedUser.tokens = userData.credits * 1000;
      updatedUser.credits = 0; // Clear old credits
      needsUpdate = true;

      console.log(
        `🔄 Migrated ${userData.credits} credits to ${updatedUser.tokens} tokens for user: ${userId}`
      );
    }

    if (needsUpdate) {
      await db.collection("users").doc(userId).update(updatedUser);
    }

    res.json({
      user: updatedUser,
      isNewUser: false,
      needsEmailVerification: !isEmailVerified,
      freeTokensAvailable: !updatedUser.freeTokensGranted,
      canChat: updatedUser.tokens >= MIN_TOKENS_FOR_CHAT,
    });
  } catch (error) {
    console.error("Auth verify error:", error);
    res.status(500).json({ message: "Failed to verify user" });
  }
});

// Check email verification status and grant tokens
router.post("/check-email-verification", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const isEmailVerified = req.user.email_verified;

    console.log(
      `📧 Checking email verification for user: ${userId}, verified: ${isEmailVerified}`
    );

    if (!isEmailVerified) {
      return res.json({
        emailVerified: false,
        message: "Email not yet verified",
      });
    }

    // Get user document
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // Check if free tokens have already been granted
    if (userData.freeTokensGranted) {
      return res.json({
        emailVerified: true,
        freeTokensGranted: true,
        tokens: userData.tokens,
        message: "Free tokens already granted",
      });
    }

    // Grant free tokens for email verification
    const updatedTokens = (userData.tokens || 0) + FREE_TOKENS_AMOUNT;

    await db.collection("users").doc(userId).update({
      tokens: updatedTokens,
      freeTokensGranted: true,
      freeTokensGrantedAt: new Date(),
      emailVerified: true,
      emailVerifiedAt: new Date(),
      updatedAt: new Date(),
    });

    console.log(
      `🎁 Granted ${FREE_TOKENS_AMOUNT} free tokens for email verification: ${req.user.email}`
    );

    res.json({
      emailVerified: true,
      freeTokensGranted: true,
      tokensGranted: FREE_TOKENS_AMOUNT,
      totalTokens: updatedTokens,
      message: `Congratulations! You've received ${FREE_TOKENS_AMOUNT.toLocaleString()} free tokens for verifying your email.`,
    });
  } catch (error) {
    console.error("Email verification check error:", error);
    res.status(500).json({ message: "Failed to check email verification" });
  }
});

// Get user token balance and usage stats
router.get("/token-balance", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const userData = userDoc.data();

    // Get recent token usage (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const usageSnapshot = await db
      .collection("tokenUsage")
      .where("userId", "==", userId)
      .where("timestamp", ">=", thirtyDaysAgo)
      .orderBy("timestamp", "desc")
      .limit(100)
      .get();

    const recentUsage = usageSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()?.toISOString(),
    }));

    const last30DaysUsage = recentUsage.reduce(
      (total, usage) => total + usage.totalTokens,
      0
    );

    res.json({
      tokens: userData.tokens || 0,
      totalTokensUsed: userData.totalTokensUsed || 0,
      last30DaysUsage,
      freeTokensGranted: userData.freeTokensGranted || false,
      emailVerified: userData.emailVerified || false,
      recentUsage: recentUsage.slice(0, 10), // Last 10 usage records
      canChat: (userData.tokens || 0) >= MIN_TOKENS_FOR_CHAT,
    });
  } catch (error) {
    console.error("Token balance error:", error);
    res.status(500).json({ message: "Failed to get token balance" });
  }
});

// Update user profile (enhanced)
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName, preferences, notificationSettings } = req.body;

    const updateData = {
      updatedAt: new Date(),
    };

    if (displayName) updateData.displayName = displayName;
    if (preferences) updateData.preferences = preferences;
    if (notificationSettings)
      updateData.notificationSettings = notificationSettings;

    await db.collection("users").doc(userId).update(updateData);

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Admin endpoint to grant tokens (for testing/support)
router.post("/admin/grant-tokens", authenticateUser, async (req, res) => {
  try {
    const { targetUserId, tokens, reason } = req.body;
    const adminUserId = req.user.uid;

    // Simple admin check (you should implement proper admin verification)
    const adminDoc = await db.collection("users").doc(adminUserId).get();
    const adminData = adminDoc.data();

    if (!adminData?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }

    // Grant tokens to target user
    await db
      .collection("users")
      .doc(targetUserId)
      .update({
        tokens: db.FieldValue.increment(tokens),
        updatedAt: new Date(),
      });

    // Log the grant
    await db.collection("tokenGrants").add({
      adminUserId,
      targetUserId,
      tokensGranted: tokens,
      reason: reason || "Admin grant",
      timestamp: new Date(),
    });

    res.json({
      message: `Successfully granted ${tokens} tokens to user ${targetUserId}`,
      tokensGranted: tokens,
    });
  } catch (error) {
    console.error("Admin grant tokens error:", error);
    res.status(500).json({ message: "Failed to grant tokens" });
  }
});

module.exports = router;
