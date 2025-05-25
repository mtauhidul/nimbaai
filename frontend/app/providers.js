// app/providers.js - Fixed version with better error handling
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
  const { setUser, setLoading, setCredits, initAuth } = useAuthStore();
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

          // Try to verify with backend, but don't fail if backend is down
          let userData;
          try {
            userData = await apiClient.verifyAuth();
            console.log("✅ Backend verification successful");
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
                credits: 100, // Default credits
                subscription: null,
              },
            };
          }

          // Update store with user data
          setUser(userData.user);
          setCredits(userData.user.credits || 100);

          console.log("✅ User data set in store:", userData.user.email);

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
          setCredits(0);
        }
      } else {
        console.log("👤 No user logged in, clearing store");
        setUser(null);
        setCredits(0);
      }

      setLoading(false);
      setAuthChecked(true);
      console.log("✅ Auth check completed");
    });

    return () => {
      console.log("🧹 Cleaning up auth listener");
      unsubscribe();
    };
  }, [isHydrated, setUser, setLoading, setCredits, router]);

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
