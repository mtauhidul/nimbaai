// app/chat/page.js - Fixed with single credits display
"use client";

import ChatInterface from "@/components/chat/ChatInterface";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - REMOVED duplicate credits */}
      <header className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">NimbaAI Chat</h1>
          {/* Removed duplicate credits - only show in model selector area */}
        </div>
      </header>

      {/* Chat Interface */}
      <div className="h-[calc(100vh-64px)]">
        <ChatInterface />
      </div>
    </div>
  );
}
