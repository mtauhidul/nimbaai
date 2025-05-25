// app/providers.js - Fixed version with proper redirect handling
"use client";

import { apiClient } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function Providers({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const { setUser, setLoading, setCredits, setSubscription } = useAuthStore();
  const router = useRouter();

  // Handle hydration first
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🔍 Auth state changed:", !!user);

      if (user) {
        try {
          console.log("🔍 Verifying user with backend...");
          const userData = await apiClient.verifyAuth();

          setUser(userData.user);
          setCredits(userData.user.credits || 0);
          setSubscription(userData.user.subscription);

          console.log("✅ User verified successfully:", userData.user.email);

          // Auto-redirect to chat if user is authenticated
          const currentPath = window.location.pathname;
          if (
            currentPath === "/auth/login" ||
            currentPath === "/auth/register" ||
            currentPath === "/"
          ) {
            console.log("🔄 Redirecting to chat...");
            router.push("/chat");
          }
        } catch (error) {
          console.error("❌ Auth verification failed:", error);
          setUser(null);
          setCredits(0);
          setSubscription(null);
        }
      } else {
        console.log("👤 No user logged in");
        setUser(null);
        setCredits(0);
        setSubscription(null);
      }

      setLoading(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, [isHydrated, setUser, setLoading, setCredits, setSubscription, router]);

  // Show loading until hydrated and auth is checked
  if (!isHydrated || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
