// stores/uiStore.js - Fixed version without persistence to avoid hydration issues
import { create } from "zustand";

export const useUIStore = create((set) => ({
  // Sidebar
  sidebarOpen: true,
  sidebarCollapsed: false,

  // Modals
  showBillingModal: false,
  showSettingsModal: false,
  showProfileModal: false,

  // Theme
  theme: "light",

  // Notifications
  notifications: [],

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Modal actions
  openBillingModal: () => set({ showBillingModal: true }),
  closeBillingModal: () => set({ showBillingModal: false }),
  openSettingsModal: () => set({ showSettingsModal: true }),
  closeSettingsModal: () => set({ showSettingsModal: false }),
  openProfileModal: () => set({ showProfileModal: true }),
  closeProfileModal: () => set({ showProfileModal: false }),

  // Theme actions
  setTheme: (theme) => set({ theme }),
  toggleTheme: () =>
    set((state) => ({
      theme: state.theme === "light" ? "dark" : "light",
    })),

  // Notification actions
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          id: Date.now(),
          ...notification,
          timestamp: new Date().toISOString(),
        },
      ],
    })),

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
