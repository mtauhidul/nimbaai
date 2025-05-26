// stores/authStore.js - Updated with token system
import { create } from "zustand";

const useAuthStore = create((set, get) => ({
  // State - Updated for token system
  user: null,
  tokens: 0, // Replace credits with tokens
  credits: 0, // Keep for backward compatibility during migration
  subscription: null,
  isLoading: true,
  isAuthenticated: false,

  // New token-specific state
  emailVerified: false,
  freeTokensGranted: false,
  needsEmailVerification: false,
  canChat: false,
  tokenUsageStats: null,

  // Actions - Updated for tokens
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  // Token management (replaces credit management)
  setTokens: (tokens) =>
    set({
      tokens,
      canChat: tokens >= 100, // Minimum tokens needed to chat
    }),

  updateUserTokens: (newTokens) =>
    set({
      tokens: newTokens,
      canChat: newTokens >= 100,
    }),

  // Deduct tokens after message (replaces credit deduction)
  deductTokens: (tokensUsed) =>
    set((state) => {
      const newTokens = Math.max(0, state.tokens - tokensUsed);
      return {
        tokens: newTokens,
        canChat: newTokens >= 100,
      };
    }),

  // Legacy credit methods (for backward compatibility)
  setCredits: (credits) => set({ credits }),
  updateUserCredits: (newCredits) => set({ credits: newCredits }),

  // Email verification state
  setEmailVerification: (emailVerified, needsVerification = false) =>
    set({
      emailVerified,
      needsEmailVerification: needsVerification,
    }),

  setFreeTokensStatus: (granted) =>
    set({
      freeTokensGranted: granted,
    }),

  // Token usage statistics
  setTokenUsageStats: (stats) =>
    set({
      tokenUsageStats: stats,
    }),

  setSubscription: (subscription) => set({ subscription }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () =>
    set({
      user: null,
      isAuthenticated: false,
      tokens: 0,
      credits: 0,
      subscription: null,
      emailVerified: false,
      freeTokensGranted: false,
      needsEmailVerification: false,
      canChat: false,
      tokenUsageStats: null,
      isLoading: false,
    }),

  // Initialize auth state - Updated for token system
  initAuth: (user) => {
    if (user) {
      set({
        user,
        isAuthenticated: true,
        tokens: user.tokens || 0,
        credits: user.credits || 0, // Legacy support
        subscription: user.subscription || null,
        emailVerified: user.emailVerified || false,
        freeTokensGranted: user.freeTokensGranted || false,
        needsEmailVerification: user.needsEmailVerification || false,
        canChat: (user.tokens || 0) >= 100,
        isLoading: false,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        tokens: 0,
        credits: 0,
        subscription: null,
        emailVerified: false,
        freeTokensGranted: false,
        needsEmailVerification: false,
        canChat: false,
        tokenUsageStats: null,
        isLoading: false,
      });
    }
  },

  // Update user data - Enhanced for token system
  updateUser: (userData) =>
    set((state) => ({
      user: { ...state.user, ...userData },
      tokens: userData.tokens !== undefined ? userData.tokens : state.tokens,
      credits:
        userData.credits !== undefined ? userData.credits : state.credits,
      subscription:
        userData.subscription !== undefined
          ? userData.subscription
          : state.subscription,
      emailVerified:
        userData.emailVerified !== undefined
          ? userData.emailVerified
          : state.emailVerified,
      freeTokensGranted:
        userData.freeTokensGranted !== undefined
          ? userData.freeTokensGranted
          : state.freeTokensGranted,
      canChat:
        userData.tokens !== undefined ? userData.tokens >= 100 : state.canChat,
    })),

  // Fetch token balance and usage stats
  fetchTokenBalance: async () => {
    try {
      const { apiClient } = await import("@/lib/api");
      const data = await apiClient.request("/api/auth/token-balance");

      set({
        tokens: data.tokens,
        tokenUsageStats: {
          totalUsed: data.totalTokensUsed,
          last30Days: data.last30DaysUsage,
          recentUsage: data.recentUsage,
        },
        emailVerified: data.emailVerified,
        freeTokensGranted: data.freeTokensGranted,
        canChat: data.canChat,
      });
    } catch (error) {
      console.error("Failed to fetch token balance:", error);
    }
  },

  // Check email verification and grant free tokens
  checkEmailVerification: async () => {
    try {
      const { apiClient } = await import("@/lib/api");
      const data = await apiClient.request(
        "/api/auth/check-email-verification",
        {
          method: "POST",
        }
      );

      if (data.freeTokensGranted && data.tokensGranted) {
        // Show success message for newly granted tokens
        set((state) => ({
          tokens: data.totalTokens,
          freeTokensGranted: true,
          emailVerified: true,
          needsEmailVerification: false,
          canChat: data.totalTokens >= 100,
        }));

        return {
          success: true,
          message: data.message,
          tokensGranted: data.tokensGranted,
        };
      }

      set({
        emailVerified: data.emailVerified,
        freeTokensGranted: data.freeTokensGranted || false,
        needsEmailVerification: !data.emailVerified,
      });

      return data;
    } catch (error) {
      console.error("Failed to check email verification:", error);
      return { success: false, error: error.message };
    }
  },
}));

export { useAuthStore };
