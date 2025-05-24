// app/providers.js - Restore proper backend verification
"use client";

import { apiClient } from "@/lib/api"; // Restore this import
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export function Providers({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const { setUser, setLoading, setCredits, setSubscription } = useAuthStore();

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Now this should work with matching Firebase projects
          const userData = await apiClient.verifyAuth();
          setUser(userData.user);
          setCredits(userData.user.credits || 0);
          setSubscription(userData.user.subscription);

          console.log("✅ Auth successful:", userData);
        } catch (error) {
          console.error("Auth verification failed:", error);
          setUser(null);
        }
      } else {
        setUser(null);
        setCredits(0);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isHydrated, setUser, setLoading, setCredits, setSubscription]);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
