// components/chat/ChatSidebar.js
"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/chatStore";
import { MessageSquare, Plus, Trash2 } from "lucide-react";

export function ChatSidebar() {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    setCurrentConversation,
  } = useChatStore();

  return (
    <div className="flex flex-col h-full">
      {/* New Chat Button */}
      <div className="p-4 border-b">
        <Button
          onClick={createNewConversation}
          className="w-full bg-accent-500 hover:bg-accent-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No conversations yet</p>
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`group flex items-center space-x-2 p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                  conversation.id === currentConversationId
                    ? "bg-accent-50 border border-accent-200"
                    : ""
                }`}
                onClick={() => setCurrentConversation(conversation.id)}
              >
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {conversation.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {conversation.messageCount} messages
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implement delete conversation
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
