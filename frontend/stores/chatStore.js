// stores/chatStore.js - Updated with token system
import { create } from "zustand";

// Simple store without persistence to avoid hydration issues
const useChatStore = create((set, get) => ({
  // State
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  selectedModel: "gpt-3.5-turbo",

  // Updated model configuration for token system
  availableModels: [
    // Most cost-effective models
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "openai",
      description: "Fast & affordable for most tasks",
      estimatedCost: "~50-200 tokens", // Rough estimate for display
    },
    {
      id: "claude-3-haiku",
      name: "Claude 3 Haiku",
      provider: "anthropic",
      description: "Lightning fast & cost-effective",
      estimatedCost: "~40-150 tokens",
    },
    // Advanced models
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "openai",
      description: "Latest GPT-4 with improved performance",
      estimatedCost: "~100-500 tokens",
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3.5 Sonnet",
      provider: "anthropic",
      description: "Most advanced reasoning & coding",
      estimatedCost: "~80-400 tokens",
    },
    // Premium models
    {
      id: "gpt-4",
      name: "GPT-4",
      provider: "openai",
      description: "Most capable OpenAI model",
      estimatedCost: "~200-800 tokens",
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "anthropic",
      description: "Most intelligent Claude model",
      estimatedCost: "~150-600 tokens",
    },
  ],

  // Token-related state
  lastTokenUsage: null,
  totalTokensUsedInSession: 0,

  // Actions with debug logging
  addMessage: (message) => {
    console.log("🏪 Store addMessage called with:", message);

    set((state) => {
      const newMessage = {
        id: message.id || `msg-${Date.now()}-${Math.random()}`,
        timestamp: message.timestamp || new Date().toISOString(),
        ...message,
      };

      const newMessages = [...state.messages, newMessage];

      console.log("🏪 Store before update:", state.messages.length, "messages");
      console.log("🏪 Store after update:", newMessages.length, "messages");
      console.log("🏪 New message added:", newMessage);

      return {
        messages: newMessages,
      };
    });

    // Log final state
    setTimeout(() => {
      const currentState = get();
      console.log(
        "🏪 Store final state:",
        currentState.messages.length,
        "messages"
      );
    }, 0);
  },

  // Add multiple messages (for user + AI response pair)
  addMessages: (messages) => {
    console.log(
      "🏪 Store addMessages called with:",
      messages.length,
      "messages"
    );

    set((state) => {
      const newMessages = messages.map((msg) => ({
        id: msg.id || `msg-${Date.now()}-${Math.random()}`,
        timestamp: msg.timestamp || new Date().toISOString(),
        ...msg,
      }));

      return {
        messages: [...state.messages, ...newMessages],
      };
    });
  },

  // Update message with token usage info
  updateMessageWithTokens: (messageId, tokenUsage) => {
    console.log("🏪 Store updateMessageWithTokens:", messageId, tokenUsage);

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              tokenUsage,
              inputTokens: tokenUsage?.input_tokens,
              outputTokens: tokenUsage?.output_tokens,
              totalTokens: tokenUsage?.total_tokens,
            }
          : msg
      ),
      lastTokenUsage: tokenUsage,
      totalTokensUsedInSession:
        state.totalTokensUsedInSession + (tokenUsage?.total_tokens || 0),
    }));
  },

  setMessages: (messages) => {
    console.log(
      "🏪 Store setMessages called with:",
      messages.length,
      "messages"
    );
    set({ messages });
  },

  clearMessages: () => {
    console.log("🏪 Store clearMessages called");
    set({
      messages: [],
      lastTokenUsage: null,
    });
  },

  setLoading: (isLoading) => {
    console.log("🏪 Store setLoading:", isLoading);
    set({ isLoading });
  },

  setSelectedModel: (model) => {
    console.log("🏪 Store setSelectedModel:", model);
    set({ selectedModel: model });
  },

  // Conversation management - Enhanced
  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  setCurrentConversation: (conversationId) => {
    console.log("🏪 Store setCurrentConversation:", conversationId);
    set({
      currentConversationId: conversationId,
      lastTokenUsage: null, // Reset token usage when switching conversations
    });
  },

  createNewConversation: () => {
    console.log("🏪 Store createNewConversation - clearing current state");

    set({
      currentConversationId: null,
      messages: [], // Clear messages for new conversation
      lastTokenUsage: null,
    });

    return null; // No temp ID needed, conversation created on first message
  },

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    })),

  deleteConversation: (conversationId) =>
    set((state) => {
      const newConversations = state.conversations.filter(
        (conv) => conv.id !== conversationId
      );

      const newCurrentId =
        state.currentConversationId === conversationId
          ? null // Clear current conversation if it was deleted
          : state.currentConversationId;

      return {
        conversations: newConversations,
        currentConversationId: newCurrentId,
        messages:
          newCurrentId === state.currentConversationId ? state.messages : [],
        lastTokenUsage:
          newCurrentId === state.currentConversationId
            ? state.lastTokenUsage
            : null,
      };
    }),

  // Enhanced utility methods for token system
  getCurrentModel: () => {
    const state = get();
    return state.availableModels.find((m) => m.id === state.selectedModel);
  },

  // Updated to check token balance instead of credits
  canSendMessage: (userTokens) => {
    const state = get();
    const minimumTokens = 100; // Minimum tokens needed to send a message
    return userTokens >= minimumTokens && !state.isLoading;
  },

  // Estimate tokens needed for a message
  estimateTokensForMessage: (message) => {
    // Very rough estimate: 1 token per 4 characters + buffer for response
    const inputEstimate = Math.ceil(message.length / 4);
    const outputEstimate = 100; // Minimum expected response
    return inputEstimate + outputEstimate;
  },

  // Get token usage statistics for current session
  getSessionStats: () => {
    const state = get();
    const messagesWithTokens = state.messages.filter(
      (msg) => msg.totalTokens > 0
    );

    return {
      totalTokensUsed: state.totalTokensUsedInSession,
      messagesWithTokens: messagesWithTokens.length,
      averageTokensPerMessage:
        messagesWithTokens.length > 0
          ? Math.round(
              state.totalTokensUsedInSession / messagesWithTokens.length
            )
          : 0,
      lastTokenUsage: state.lastTokenUsage,
    };
  },

  // Send message with token tracking
  sendMessage: async (message, authStore) => {
    const state = get();
    const { user, tokens, deductTokens } = authStore;

    if (!user) {
      throw new Error("Not authenticated");
    }

    if (!state.canSendMessage(tokens)) {
      throw new Error("Insufficient tokens to send message");
    }

    console.log("🚀 Sending message with token tracking...");

    // Set loading state
    set({ isLoading: true });

    try {
      // Get auth token
      const authToken = await user.getIdToken();

      // Send request to backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/message`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message,
            model: state.selectedModel,
            conversationId: state.currentConversationId,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send message");
      }

      const data = await response.json();

      console.log("✅ Message sent successfully:", data);

      // Add both user and AI messages to store
      const userMessage = {
        id: data.userMessage.id,
        role: "user",
        content: message,
        timestamp: data.userMessage.timestamp,
      };

      const aiMessage = {
        id: data.aiMessage.id,
        role: "assistant",
        content: data.aiMessage.content,
        timestamp: data.aiMessage.timestamp,
        model: data.aiMessage.model,
        tokenUsage: data.tokenUsage,
        inputTokens: data.tokenUsage?.input_tokens || 0,
        outputTokens: data.tokenUsage?.output_tokens || 0,
        totalTokens: data.tokenUsage?.total_tokens || 0,
        isError: data.isError,
      };

      // Add messages to store
      get().addMessages([userMessage, aiMessage]);

      // Update conversation ID if new
      if (
        data.conversationId &&
        data.conversationId !== state.currentConversationId
      ) {
        set({ currentConversationId: data.conversationId });
      }

      // Update token usage stats
      set((prevState) => ({
        lastTokenUsage: data.tokenUsage,
        totalTokensUsedInSession:
          prevState.totalTokensUsedInSession + (data.tokensUsed || 0),
      }));

      // Update auth store with new token balance
      if (data.tokensUsed > 0) {
        deductTokens(data.tokensUsed);
      }

      return {
        success: true,
        tokensUsed: data.tokensUsed,
        remainingTokens: data.remainingTokens,
        conversationId: data.conversationId,
      };
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // Debug method
  debugState: () => {
    const state = get();
    console.log("🏪 Full store state:", {
      messagesCount: state.messages.length,
      messages: state.messages,
      isLoading: state.isLoading,
      selectedModel: state.selectedModel,
      currentConversationId: state.currentConversationId,
      lastTokenUsage: state.lastTokenUsage,
      totalTokensUsedInSession: state.totalTokensUsedInSession,
    });
  },

  // Reset store
  reset: () => {
    console.log("🏪 Store reset called");
    set({
      messages: [],
      conversations: [],
      currentConversationId: null,
      isLoading: false,
      selectedModel: "gpt-3.5-turbo",
      lastTokenUsage: null,
      totalTokensUsedInSession: 0,
    });
  },
}));

export { useChatStore };
