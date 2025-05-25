// stores/chatStore.js - Fixed with debug logging
import { create } from "zustand";

// Simple store without persistence to avoid hydration issues
const useChatStore = create((set, get) => ({
  // State
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  selectedModel: "gpt-3.5-turbo",
  availableModels: [
    // Most cost-effective models first
    {
      id: "gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      cost: 1,
      provider: "openai",
      description: "Fast & affordable for most tasks",
    },
    {
      id: "claude-3-haiku",
      name: "Claude 3 Haiku",
      cost: 1,
      provider: "anthropic",
      description: "Lightning fast & cost-effective",
    },
    // Best value advanced models
    {
      id: "gpt-4-turbo",
      name: "GPT-4 Turbo",
      cost: 3,
      provider: "openai",
      description: "Latest GPT-4 with improved performance",
    },
    {
      id: "claude-3-sonnet",
      name: "Claude 3.5 Sonnet",
      cost: 3,
      provider: "anthropic",
      description: "Most advanced reasoning & coding",
    },
    // Premium models for complex tasks
    {
      id: "gpt-4",
      name: "GPT-4",
      cost: 5,
      provider: "openai",
      description: "Most capable OpenAI model",
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      cost: 5,
      provider: "anthropic",
      description: "Most intelligent Claude model",
    },
  ],

  // Actions with debug logging
  addMessage: (message) => {
    console.log("🏪 Store addMessage called with:", message);

    set((state) => {
      const newMessage = {
        id: message.id || `msg-${Date.now()}-${Math.random()}`,
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
      console.log("🏪 All messages:", currentState.messages);
    }, 0);
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
    set({ messages: [] });
  },

  setLoading: (isLoading) => {
    console.log("🏪 Store setLoading:", isLoading);
    set({ isLoading });
  },

  setSelectedModel: (model) => {
    console.log("🏪 Store setSelectedModel:", model);
    set({ selectedModel: model });
  },

  // Conversation management
  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  setCurrentConversation: (conversationId) => {
    console.log("🏪 Store setCurrentConversation:", conversationId);
    set({
      currentConversationId: conversationId,
      // DON'T clear messages when switching conversations for now
      // messages: [],
    });
  },

  createNewConversation: () => {
    const newConversation = {
      id: `temp-${Date.now()}`,
      title: "New Chat",
      messageCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log("🏪 Store createNewConversation:", newConversation.id);

    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: newConversation.id,
      // DON'T clear messages for now
      // messages: [],
    }));

    return newConversation.id;
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
          ? newConversations[0]?.id || null
          : state.currentConversationId;

      return {
        conversations: newConversations,
        currentConversationId: newCurrentId,
        messages:
          newCurrentId === state.currentConversationId ? state.messages : [],
      };
    }),

  // Utility methods
  getCurrentModel: () => {
    const state = get();
    return state.availableModels.find((m) => m.id === state.selectedModel);
  },

  canSendMessage: (userCredits) => {
    const state = get();
    const currentModel = state.availableModels.find(
      (m) => m.id === state.selectedModel
    );
    return userCredits >= (currentModel?.cost || 1) && !state.isLoading;
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
    });
  },
}));

export { useChatStore };
