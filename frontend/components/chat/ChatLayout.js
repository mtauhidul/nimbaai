// components/chat/ChatLayout.js
"use client";

import { useUIStore } from "@/stores/uiStore";
import { ChatHeader } from "./ChatHeader";
import { ChatInterface } from "./ChatInterface";
import { ChatSidebar } from "./ChatSidebar";

export function ChatLayout() {
  const { sidebarOpen } = useUIStore();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "w-80" : "w-0"
        } transition-all duration-300 overflow-hidden bg-white border-r`}
      >
        <ChatSidebar />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <ChatInterface />
      </div>
    </div>
  );
}
