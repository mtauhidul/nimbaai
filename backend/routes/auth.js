// backend/routes/auth.js
const express = require("express");
const { db } = require("../services/firebase-admin");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// Verify token and get user data
router.get("/verify", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;

    // Get user document from Firestore
    const userDoc = await db.collection("users").doc(userId).get();

    if (!userDoc.exists) {
      // Create new user document
      const newUser = {
        uid: userId,
        email: req.user.email,
        displayName: req.user.name || req.user.email.split("@")[0],
        credits: 50, // Welcome credits
        subscription: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        totalSpent: 0,
        messagesCount: 0,
      };

      await db.collection("users").doc(userId).set(newUser);

      return res.json({
        user: newUser,
        isNewUser: true,
      });
    }

    const userData = userDoc.data();

    res.json({
      user: userData,
      isNewUser: false,
    });
  } catch (error) {
    console.error("Auth verify error:", error);
    res.status(500).json({ message: "Failed to verify user" });
  }
});

// Update user profile
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;
    const { displayName, preferences } = req.body;

    const updateData = {
      updatedAt: new Date(),
    };

    if (displayName) updateData.displayName = displayName;
    if (preferences) updateData.preferences = preferences;

    await db.collection("users").doc(userId).update(updateData);

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Profile update error:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

module.exports = router;
