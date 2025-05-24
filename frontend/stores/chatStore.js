// stores/chatStore.js

import { create } from "zustand";

export const useChatStore = create((set, get) => ({
  // Current conversation
  messages: [],
  isLoading: false,
  selectedModel: "gpt-3.5-turbo",
  temperature: 0.7,

  // Conversations list
  conversations: [],
  currentConversationId: null,

  // Actions
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, { ...message, id: Date.now() }],
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setSelectedModel: (model) => set({ selectedModel: model }),
  setTemperature: (temperature) => set({ temperature }),

  // Conversation management
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (conversationId) =>
    set({ currentConversationId: conversationId }),

  createNewConversation: () => {
    const newConversation = {
      id: Date.now().toString(),
      title: "New Chat",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };
    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: newConversation.id,
      messages: [],
    }));
    return newConversation.id;
  },

  clearCurrentChat: () =>
    set({
      messages: [],
      currentConversationId: null,
    }),

  // Model pricing (credits per message)
  getModelCost: (model) => {
    const costs = {
      "gpt-3.5-turbo": 1,
      "gpt-4": 5,
      "gpt-4-turbo": 3,
      "claude-3-sonnet": 3,
      "claude-3-opus": 5,
    };
    return costs[model] || 1;
  },

  // Available models
  availableModels: [
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "OpenAI", cost: 1 },
    { id: "gpt-4", name: "GPT-4", provider: "OpenAI", cost: 5 },
    { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "OpenAI", cost: 3 },
    {
      id: "claude-3-sonnet",
      name: "Claude 3 Sonnet",
      provider: "Anthropic",
      cost: 3,
    },
    {
      id: "claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      cost: 5,
    },
  ],
}));
