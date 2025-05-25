// stores/authStore.js
import { create } from "zustand";

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  credits: 0,
  subscription: null,
  isLoading: true,
  isAuthenticated: false,

  // Actions
  setUser: (user) =>
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    }),

  setCredits: (credits) => set({ credits }),

  setSubscription: (subscription) => set({ subscription }),

  updateUserCredits: (newCredits) => set({ credits: newCredits }),

  setLoading: (isLoading) => set({ isLoading }),

  signOut: () =>
    set({
      user: null,
      isAuthenticated: false,
      credits: 0,
      subscription: null,
      isLoading: false,
    }),

  // Initialize auth state
  initAuth: (user) => {
    if (user) {
      set({
        user,
        isAuthenticated: true,
        credits: user.credits || 100, // Default credits
        subscription: user.subscription || null,
        isLoading: false,
      });
    } else {
      set({
        user: null,
        isAuthenticated: false,
        credits: 0,
        subscription: null,
        isLoading: false,
      });
    }
  },

  // Update user data
  updateUser: (userData) =>
    set((state) => ({
      user: { ...state.user, ...userData },
      credits:
        userData.credits !== undefined ? userData.credits : state.credits,
      subscription:
        userData.subscription !== undefined
          ? userData.subscription
          : state.subscription,
    })),
}));

export { useAuthStore };
