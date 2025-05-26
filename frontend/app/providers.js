// app/providers.js - Updated for token system
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
  const {
    setUser,
    setLoading,
    setTokens,
    setCredits,
    setEmailVerification,
    setFreeTokensStatus,
    initAuth,
  } = useAuthStore();
  const router = useRouter();

  // Handle hydration first
  useEffect(() => {
    console.log("🔄 Providers: Setting hydrated to true");
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    console.log("🔄 Providers: Setting up auth listener");

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log(
        "🔍 Auth state changed:",
        user ? `User: ${user.email}` : "No user"
      );

      if (user) {
        try {
          console.log("🔍 Verifying user with backend...");

          // Verify with backend and get user data
          let userData;
          try {
            userData = await apiClient.verifyAuth();
            console.log("✅ Backend verification successful:", userData);
          } catch (backendError) {
            console.warn(
              "⚠️ Backend verification failed, using Firebase user data:",
              backendError.message
            );
            // Use Firebase user data as fallback
            userData = {
              user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                photoURL: user.photoURL,
                tokens: 0, // Start with 0 tokens
                credits: 0, // Legacy support
                emailVerified: user.emailVerified || false,
                freeTokensGranted: false,
                subscription: null,
              },
              needsEmailVerification: !user.emailVerified,
              freeTokensAvailable: !user.emailVerified,
              canChat: false,
            };
          }

          // Update store with BOTH token and legacy credit data
          setUser(userData.user);

          // Handle both token and credit systems
          if (userData.user.tokens !== undefined) {
            console.log("🪙 Setting tokens:", userData.user.tokens);
            setTokens(userData.user.tokens);
          }

          if (userData.user.credits !== undefined) {
            console.log("💰 Setting credits (legacy):", userData.user.credits);
            setCredits(userData.user.credits);
          }

          // Set email verification status
          setEmailVerification(
            userData.user.emailVerified || false,
            userData.needsEmailVerification || false
          );

          // Set free tokens status
          setFreeTokensStatus(userData.user.freeTokensGranted || false);

          console.log("✅ User data set in store:", {
            email: userData.user.email,
            tokens: userData.user.tokens,
            credits: userData.user.credits,
            emailVerified: userData.user.emailVerified,
            freeTokensGranted: userData.user.freeTokensGranted,
          });

          // Auto-redirect to chat if user is authenticated
          const currentPath = window.location.pathname;
          if (
            currentPath === "/auth/login" ||
            currentPath === "/auth/register" ||
            currentPath === "/"
          ) {
            console.log("🔄 Redirecting to chat from:", currentPath);
            router.push("/chat");
          }
        } catch (error) {
          console.error("❌ Auth setup failed:", error);
          // Still set user to null and continue
          setUser(null);
          setTokens(0);
          setCredits(0);
          setEmailVerification(false, false);
          setFreeTokensStatus(false);
        }
      } else {
        console.log("👤 No user logged in, clearing store");
        setUser(null);
        setTokens(0);
        setCredits(0);
        setEmailVerification(false, false);
        setFreeTokensStatus(false);
      }

      setLoading(false);
      setAuthChecked(true);
      console.log("✅ Auth check completed");
    });

    return () => {
      console.log("🧹 Cleaning up auth listener");
      unsubscribe();
    };
  }, [
    isHydrated,
    setUser,
    setLoading,
    setTokens,
    setCredits,
    setEmailVerification,
    setFreeTokensStatus,
    router,
  ]);

  // Show simple loading until ready
  if (!isHydrated || !authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-gray-500 text-sm">
            {!isHydrated ? "Initializing..." : "Checking authentication..."}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
