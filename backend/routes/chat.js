// backend/routes/chat.js - Updated with real token system
const express = require("express");
const { authenticateUser } = require("../middleware/auth");
const { generateResponse: openaiResponse } = require("../services/openai");
const {
  generateResponse: anthropicResponse,
} = require("../services/anthropic");
const { db } = require("../services/firebase-admin");
const { FieldValue } = require("firebase-admin/firestore");

const router = express.Router();

// Model configuration with token-based pricing
const MODEL_CONFIG = {
  // Cost-effective models
  "gpt-3.5-turbo": {
    provider: "openai",
    model: "gpt-3.5-turbo",
    name: "GPT-3.5 Turbo",
  },
  "claude-3-haiku": {
    provider: "anthropic",
    model: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
  },

  // Advanced models
  "gpt-4-turbo": {
    provider: "openai",
    model: "gpt-4-turbo-preview",
    name: "GPT-4 Turbo",
  },
  "claude-3-sonnet": {
    provider: "anthropic",
    model: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
  },

  // Premium models
  "gpt-4": {
    provider: "openai",
    model: "gpt-4",
    name: "GPT-4",
  },
  "claude-3-opus": {
    provider: "anthropic",
    model: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
  },
};

// Estimate minimum tokens needed for a message (rough estimate)
const estimateTokensNeeded = (message) => {
  // Very rough estimate: 1 token per 4 characters + 100 tokens buffer for response
  const inputEstimate = Math.ceil(message.length / 4);
  const outputEstimate = 100; // Minimum expected response
  return inputEstimate + outputEstimate;
};

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Chat API is running" });
});

// Send message endpoint with real token system
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

    // Get user data and check token balance
    const userDoc = await db.collection("users").doc(userId).get();
    const userData = userDoc.data();

    if (!userData) {
      console.log("❌ User not found in database");
      return res.status(404).json({ error: "User not found" });
    }

    const userTokens = userData.tokens || 0;
    const estimatedTokens = estimateTokensNeeded(message);

    console.log(
      `🪙 User has ${userTokens} tokens, estimated need: ${estimatedTokens}`
    );

    // Check if user has sufficient tokens (rough estimate)
    if (userTokens < estimatedTokens) {
      return res.status(400).json({
        error: "Insufficient tokens",
        estimated: estimatedTokens,
        available: userTokens,
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

    // Generate AI response and capture real token usage
    let aiResponse;
    let tokenUsage = null;
    let aiError = null;

    try {
      console.log(`🚀 Calling ${modelConfig.provider} API...`);

      let result;
      if (modelConfig.provider === "openai") {
        result = await openaiResponse(conversationHistory, modelConfig.model);
      } else if (modelConfig.provider === "anthropic") {
        result = await anthropicResponse(
          conversationHistory,
          modelConfig.model
        );
      } else {
        throw new Error("Unknown AI provider");
      }

      aiResponse = result.content;
      tokenUsage = result.tokenUsage;

      console.log(`✅ AI response generated (${aiResponse.length} characters)`);
      console.log(`🪙 Real token usage:`, tokenUsage);
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

    // Save AI message with token usage
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
      // Store real token usage data
      tokenUsage: tokenUsage || null,
      inputTokens: tokenUsage?.input_tokens || 0,
      outputTokens: tokenUsage?.output_tokens || 0,
      totalTokens: tokenUsage?.total_tokens || 0,
    });

    // Update conversation metadata
    await db
      .collection("conversations")
      .doc(finalConversationId)
      .update({
        updatedAt: new Date(),
        messageCount: FieldValue.increment(2),
      });

    // Deduct REAL tokens from user only if AI call was successful
    let tokensUsed = 0;
    if (!aiError && tokenUsage) {
      tokensUsed = tokenUsage.total_tokens;

      // Deduct actual tokens used
      await db
        .collection("users")
        .doc(userId)
        .update({
          tokens: FieldValue.increment(-tokensUsed),
        });

      // Record token usage for analytics
      await db.collection("tokenUsage").add({
        userId,
        conversationId: finalConversationId,
        messageId: aiMessageRef.id,
        model,
        inputTokens: tokenUsage.input_tokens,
        outputTokens: tokenUsage.output_tokens,
        totalTokens: tokenUsage.total_tokens,
        timestamp: new Date(),
      });

      console.log(`🪙 Deducted ${tokensUsed} tokens from user`);
    }

    // Return response with real token data
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
      tokensUsed: tokensUsed,
      remainingTokens: aiError ? userTokens : userTokens - tokensUsed,
      tokenUsage: tokenUsage,
      aiProvider: modelConfig.provider,
      isError: !!aiError,
    };

    console.log(
      `✅ Message processed successfully. Tokens used: ${tokensUsed}`
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

// Get conversations (unchanged)
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

// Get conversation messages (unchanged)
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
