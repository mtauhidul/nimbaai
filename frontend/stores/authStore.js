// stores/authStore.js - Fixed version
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isLoading: true,
      credits: 0,
      subscription: null,

      setUser: (user) => set({ user, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
      setCredits: (credits) => set({ credits }),
      setSubscription: (subscription) => set({ subscription }),

      signOut: () =>
        set({
          user: null,
          credits: 0,
          subscription: null,
          isLoading: false,
        }),

      // Helper getters
      isAuthenticated: () => !!get().user,
      hasCredits: () => get().credits > 0,
      hasActiveSubscription: () => {
        const sub = get().subscription;
        return (
          sub && sub.status === "active" && new Date(sub.endDate) > new Date()
        );
      },
    }),
    {
      name: "nimba-auth",
      storage: createJSONStorage(() => {
        // Only use localStorage on client side
        if (typeof window !== "undefined") {
          return localStorage;
        }
        // Return a dummy storage for SSR
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        user: state.user,
        credits: state.credits,
        subscription: state.subscription,
      }),
    }
  )
);
