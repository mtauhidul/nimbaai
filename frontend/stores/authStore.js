// stores/authStore.js - Enhanced with dual currency support (keeping all existing functionality)
import { create } from "zustand";

const useAuthStore = create((set, get) => ({
  // EXISTING State (keeping everything as-is)
  user: null,
  tokens: 0,
  credits: 0, // Keep for backward compatibility during migration
  subscription: null,
  isLoading: true,
  isAuthenticated: false,

  // Existing token-specific state
  emailVerified: false,
  freeTokensGranted: false,
  needsEmailVerification: false,
  canChat: false,
  tokenUsageStats: null,

  // NEW: Dual currency additions (won't break existing code)
  preferredCurrency: "USD", // User's preferred currency
  purchaseHistory: [],
  tokenStats: null,
  lastPurchase: null,

  // EXISTING Actions (all preserved exactly as they were)
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
      // NEW: Also set currency preference if available
      preferredCurrency:
        user?.preferredCurrency || get().preferredCurrency || "USD",
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
      // NEW: Reset currency state
      preferredCurrency: DEFAULT_CURRENCY,
      purchaseHistory: [],
      tokenStats: null,
      lastPurchase: null,
      isLoading: false,
    }),

  // Initialize auth state - Enhanced but backward compatible
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
        // NEW: Initialize currency preference
        preferredCurrency: user.preferredCurrency || "USD",
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
        // NEW: Reset currency state
        preferredCurrency: "USD",
        purchaseHistory: [],
        tokenStats: null,
        lastPurchase: null,
        isLoading: false,
      });
    }
  },

  // Update user data - Enhanced but backward compatible
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
      // NEW: Update currency preference if provided
      preferredCurrency:
        userData.preferredCurrency !== undefined
          ? userData.preferredCurrency
          : state.preferredCurrency,
    })),

  // EXISTING methods (kept exactly as they were)
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

  // NEW: Dual Currency Methods (additions that won't break existing functionality)

  // Set currency preference
  setPreferredCurrency: (currency) =>
    set({
      preferredCurrency: currency,
    }),

  // Fetch comprehensive token statistics
  fetchTokenStats: async () => {
    try {
      const { apiClient } = await import("@/lib/api");
      const data = await apiClient.getTokenStats();

      set({
        tokenStats: data,
        tokens: data.currentBalance?.totalTokens || get().tokens,
        canChat: data.currentBalance?.canChat ?? get().canChat,
        preferredCurrency:
          data.preferences?.preferredCurrency || get().preferredCurrency,
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch token stats:", error);
      return null;
    }
  },

  // Fetch purchase history
  fetchPurchaseHistory: async (limit = 20) => {
    try {
      const { apiClient } = await import("@/lib/api");
      const data = await apiClient.getPurchaseHistory(limit);

      set({
        purchaseHistory: data.purchases || [],
        lastPurchase: data.purchases?.[0] || null,
        preferredCurrency:
          data.summary?.preferredCurrency || get().preferredCurrency,
      });

      return data;
    } catch (error) {
      console.error("Failed to fetch purchase history:", error);
      return null;
    }
  },

  // Purchase tokens with dual currency support
  purchaseTokens: async (tokens, currency = "USD") => {
    try {
      const { apiClient } = await import("@/lib/api");
      const purchaseData = await apiClient.purchaseTokens(tokens, currency);

      // Update local state with new token balance
      set((state) => ({
        tokens: purchaseData.user?.totalTokens || state.tokens,
        canChat: (purchaseData.user?.totalTokens || state.tokens) >= 100,
        preferredCurrency: currency,
        lastPurchase: purchaseData.purchase,
      }));

      // Refresh token stats and purchase history in background
      setTimeout(() => {
        get().fetchTokenStats();
        get().fetchPurchaseHistory();
      }, 1000);

      return purchaseData;
    } catch (error) {
      console.error("Failed to purchase tokens:", error);
      throw error;
    }
  },

  // Get token pricing for different currencies
  getTokenPricing: async (currency = "USD") => {
    try {
      const { apiClient } = await import("@/lib/api");
      return await apiClient.getTokenPricing(currency);
    } catch (error) {
      console.error("Failed to get token pricing:", error);
      throw error;
    }
  },

  // Calculate custom token price
  calculateTokenPrice: async (tokens, currency = "USD") => {
    try {
      const { apiClient } = await import("@/lib/api");
      return await apiClient.calculateTokenPrice(tokens, currency);
    } catch (error) {
      console.error("Failed to calculate token price:", error);
      throw error;
    }
  },

  // Auto-detect user's preferred currency
  detectPreferredCurrency: () => {
    const state = get();

    // Priority order for currency detection:
    // 1. User's saved preference
    if (state.user?.preferredCurrency) {
      return state.user.preferredCurrency;
    }

    // 2. Last purchase currency
    if (state.lastPurchase?.currency) {
      return state.lastPurchase.currency;
    }

    // 3. Browser language/location detection
    if (typeof window !== "undefined") {
      const userLang = navigator.language || navigator.userLanguage;
      if (userLang.includes("bn") || userLang.includes("BD")) {
        return "BDT";
      }
    }

    // 4. Default to USD
    return "USD";
  },
}));

export { useAuthStore };
