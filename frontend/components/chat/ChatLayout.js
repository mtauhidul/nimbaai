// components/chat/ChatLayout.js - Fixed with proper height constraints
"use client";

import { useUIStore } from "@/stores/uiStore";
import { ChatHeader } from "./ChatHeader";
import ChatInterface from "./ChatInterface"; // Default export, no brackets
import { ChatSidebar } from "./ChatSidebar";

export function ChatLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 overflow-hidden bg-white border-r flex-shrink-0`}
      >
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <ChatHeader />
        </div>

        {/* Scrollable Chat Content */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>
      </div>
    </div>
  );
}
