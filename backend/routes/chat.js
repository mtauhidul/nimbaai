// backend/routes/chat.js - Fixed Firebase FieldValue imports
const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const { generateResponse: openaiResponse } = require("../services/openai");
const {
  generateResponse: anthropicResponse,
} = require("../services/anthropic");
const { db } = require("../services/firebase-admin");
const { FieldValue } = require("firebase-admin/firestore"); // Add this import

const router = express.Router();

// Model configuration with real AI providers
const MODEL_CONFIG = {
  // Cost-effective models (1 credit)
  "gpt-3.5-turbo": {
    provider: "openai",
    cost: 1,
    model: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
  },
  "claude-3-haiku": {
    provider: "anthropic",
    cost: 1,
    model: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
  },

  // Best value advanced models (3 credits)
  "gpt-4-turbo": {
    provider: "openai",
    cost: 3,
    model: "gpt-4-turbo-preview", // Latest GPT-4 Turbo
    name: "GPT-4 Turbo",
  },
  "claude-3-sonnet": {
    provider: "anthropic",
    cost: 3,
    model: "claude-3-5-sonnet-20241022", // Latest Claude 3.5 Sonnet
    name: "Claude 3.5 Sonnet",
  },

  // Premium models (5 credits)
  "gpt-4": {
    provider: "openai",
    cost: 5,
    model: "gpt-4", // Standard GPT-4
    name: "GPT-4",
  },
  "claude-3-opus": {
    provider: "anthropic",
    cost: 5,
    model: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
  },
};

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Chat API is running" });
});

// Send message endpoint with real AI
router.post("/message", authenticateUser, async (req, res) => {
  try {
    const { message, model = "gpt-3.5-turbo", conversationId } = req.body;
    const userId = req.user.uid;

    console.log(`🤖 Processing message for user: ${userId}, model: ${model}`);
    console.log(`💬 Message: "${message}"`);

    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get model configuration
    const modelConfig = MODEL_CONFIG[model];
    if (!modelConfig) {
      return res.status(400).json({ error: "Invalid model selected" });
    }

    // Get user data and check credits
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      console.log("❌ User not found in database");
      return res.status(404).json({ error: "User not found" });
    }

    const userCredits = userData.credits || 0;
    console.log(
      `💰 User has ${userCredits} credits, needs ${modelConfig.cost}`
    );

    if (userCredits < modelConfig.cost) {
      return res.status(400).json({
        error: "Insufficient credits",
        required: modelConfig.cost,
        available: userCredits,
      });
    }

    // Prepare conversation history for context
    let conversationHistory = [];

    if (conversationId) {
      try {
        // Get existing conversation
        const conversationDoc = await db
          .collection("conversations")
          .doc(conversationId)
          .get();

        if (
          conversationDoc.exists &&
          conversationDoc.data().userId === userId
        ) {
          // Get recent messages for context (last 10 messages)
          const messagesSnapshot = await db
            .collection("conversations")
            .doc(conversationId)
            .collection("messages")
            .orderBy("timestamp", "desc")
            .limit(10)
            .get();

          conversationHistory = messagesSnapshot.docs.reverse().map((doc) => ({
            role: doc.data().role,
            content: doc.data().content,
          }));

          console.log(
            `📚 Loaded ${conversationHistory.length} previous messages for context`
          );
        }
      } catch (error) {
        console.warn("⚠️ Could not load conversation history:", error);
      }
    }

    // Add current user message to history
    conversationHistory.push({
      role: "user",
      content: message,
    });

    // Generate AI response
    let aiResponse;
    let aiError = null;

    try {
      console.log(`🚀 Calling ${modelConfig.provider} API...`);

      if (modelConfig.provider === "openai") {
        aiResponse = await openaiResponse(
          conversationHistory,
          modelConfig.model
        );
      } else if (modelConfig.provider === "anthropic") {
        aiResponse = await anthropicResponse(
          conversationHistory,
          modelConfig.model
        );
      } else {
        throw new Error("Unknown AI provider");
      }

      console.log(`✅ AI response generated (${aiResponse.length} characters)`);
    } catch (error) {
      console.error(`❌ ${modelConfig.provider} API Error:`, error);
      aiError = error;

      // Provide fallback response
      aiResponse = `I apologize, but I'm having trouble connecting to ${modelConfig.name} right now. Please try again in a moment.`;
    }

    // Create or update conversation
    let finalConversationId = conversationId;

    if (!conversationId) {
      // Create new conversation
      const newConversationRef = db.collection("conversations").doc();
      finalConversationId = newConversationRef.id;

      const conversationTitle =
        message.substring(0, 50) + (message.length > 50 ? "..." : "");

      await newConversationRef.set({
        id: finalConversationId,
        userId,
        title: conversationTitle,
        createdAt: new Date(),
        updatedAt: new Date(),
        messageCount: 0,
      });

      console.log(`📝 Created new conversation: ${finalConversationId}`);
    }

    // Save user message
    const userMessageRef = db
      .collection("conversations")
      .doc(finalConversationId)
      .collection("messages")
      .doc();

    await userMessageRef.set({
      id: userMessageRef.id,
      role: "user",
      content: message,
      timestamp: new Date(),
      conversationId: finalConversationId,
    });

    // Save AI message
    const aiMessageRef = db
      .collection("conversations")
      .doc(finalConversationId)
      .collection("messages")
      .doc();

    await aiMessageRef.set({
      id: aiMessageRef.id,
      role: "assistant",
      content: aiResponse,
      timestamp: new Date(),
      conversationId: finalConversationId,
      model: model,
      error: aiError ? aiError.message : null,
    });

    // Update conversation metadata - FIXED: Use proper FieldValue import
    await db
      .collection("conversations")
      .doc(finalConversationId)
      .update({
        updatedAt: new Date(),
        messageCount: FieldValue.increment(2), // Fixed: Use imported FieldValue
      });

    // Deduct credits from user only if AI call was successful - FIXED
    if (!aiError) {
      await db
        .collection("users")
        .doc(userId)
        .update({
          credits: FieldValue.increment(-modelConfig.cost), // Fixed: Use imported FieldValue
        });
      console.log(`💰 Deducted ${modelConfig.cost} credits from user`);
    }

    // Return response
    const response = {
      success: true,
      conversationId: finalConversationId,
      userMessage: {
        id: userMessageRef.id,
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      },
      aiMessage: {
        id: aiMessageRef.id,
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString(),
        model: model,
      },
      creditsUsed: aiError ? 0 : modelConfig.cost,
      remainingCredits: aiError ? userCredits : userCredits - modelConfig.cost,
      aiProvider: modelConfig.provider,
      isError: !!aiError,
    };

    console.log(
      `✅ Message processed successfully. Credits used: ${response.creditsUsed}`
    );
    res.json(response);
  } catch (error) {
    console.error("💥 Chat message error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
      success: false,
    });
  }
});

// Get conversations
router.get("/conversations", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.uid;

    const conversationsSnapshot = await db
      .collection("conversations")
      .where("userId", "==", userId)
      .orderBy("updatedAt", "desc")
      .limit(50)
      .get();

    const conversations = conversationsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
    }));

    res.json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Get conversation messages
router.get(
  "/conversations/:conversationId/messages",
  authenticateUser,
  async (req, res) => {
    try {
      const { conversationId } = req.params;
      const userId = req.user.uid;

      // Verify conversation belongs to user
      const conversationDoc = await db
        .collection("conversations")
        .doc(conversationId)
        .get();
      if (!conversationDoc.exists || conversationDoc.data().userId !== userId) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      const messagesSnapshot = await db
        .collection("conversations")
        .doc(conversationId)
        .collection("messages")
        .orderBy("timestamp", "asc")
        .get();

      const messages = messagesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate()?.toISOString(),
      }));

      res.json({ messages });
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  }
);

module.exports = router;
