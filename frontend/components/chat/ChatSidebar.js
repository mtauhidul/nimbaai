// components/chat/ChatSidebar.js - Updated with full functionality
"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { Loader2, MessageSquare, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ChatSidebar() {
  const {
    conversations,
    currentConversationId,
    setConversations,
    setCurrentConversation,
    clearMessages,
    setMessages,
    deleteConversation,
  } = useChatStore();

  const { user } = useAuthStore();

  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState(null);

  // Load conversations when component mounts
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    setIsLoadingConversations(true);
    try {
      console.log("📚 Loading conversations...");
      const data = await apiClient.getConversations();

      setConversations(data.conversations || []);
      console.log("✅ Loaded conversations:", data.conversations?.length || 0);
    } catch (error) {
      console.error("❌ Failed to load conversations:", error);
      toast.error("Failed to load conversations", {
        description: error.message,
      });
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleCreateNewConversation = async () => {
    setIsCreatingNew(true);
    try {
      console.log("🆕 Creating new conversation...");

      // Clear current messages and conversation
      clearMessages();
      setCurrentConversation(null);

      // Scroll to top of chat area if needed
      const chatArea = document.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (chatArea) {
        chatArea.scrollTo({ top: 0, behavior: "smooth" });
      }

      toast.success("New conversation started", {
        description: "Send a message to begin your new chat!",
      });

      console.log(
        "✅ New conversation ready - cleared messages and current conversation"
      );
    } catch (error) {
      console.error("❌ Failed to create new conversation:", error);
      toast.error("Failed to start new conversation", {
        description: error.message,
      });
    } finally {
      setIsCreatingNew(false);
    }
  };

  const handleSelectConversation = async (conversationId) => {
    if (conversationId === currentConversationId) return;

    try {
      console.log("🔄 Switching to conversation:", conversationId);

      // Set the current conversation
      setCurrentConversation(conversationId);

      // Load messages for this conversation
      const data = await apiClient.getConversationMessages(conversationId);
      setMessages(data.messages || []);

      console.log("✅ Loaded messages:", data.messages?.length || 0);

      toast.success("Conversation loaded", {
        description: `Loaded ${data.messages?.length || 0} messages`,
      });
    } catch (error) {
      console.error("❌ Failed to load conversation:", error);
      toast.error("Failed to load conversation", {
        description: error.message,
      });
    }
  };

  const handleDeleteConversation = async (conversationId) => {
    try {
      console.log("🗑️ Deleting conversation:", conversationId);

      await apiClient.deleteConversation(conversationId);

      // Remove from local state
      deleteConversation(conversationId);

      // If this was the current conversation, clear it
      if (conversationId === currentConversationId) {
        clearMessages();
        setCurrentConversation(null);
      }

      toast.success("Conversation deleted", {
        description: "The conversation has been permanently deleted.",
      });

      console.log("✅ Conversation deleted");
    } catch (error) {
      console.error("❌ Failed to delete conversation:", error);
      toast.error("Failed to delete conversation", {
        description: error.message,
      });
    }
  };

  const confirmDelete = (conversation) => {
    setConversationToDelete(conversation);
    setDeleteDialogOpen(true);
  };

  const executeDelete = () => {
    if (conversationToDelete) {
      handleDeleteConversation(conversationToDelete.id);
      setDeleteDialogOpen(false);
      setConversationToDelete(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  };

  return (
    <>
      <div className="flex flex-col h-full bg-white">
        {/* New Chat Button */}
        <div className="p-4 border-b">
          <Button
            onClick={handleCreateNewConversation}
            disabled={isCreatingNew}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            {isCreatingNew ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            {isCreatingNew ? "Creating..." : "New Chat"}
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoadingConversations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">
                  Loading conversations...
                </span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Start a new chat to begin
                </p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`group flex items-start space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                    conversation.id === currentConversationId
                      ? "bg-blue-50 border border-blue-200"
                      : ""
                  }`}
                  onClick={() => handleSelectConversation(conversation.id)}
                >
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />

                  <div className="flex-1 min-w-0 overflow-hidden">
                    <p className="text-sm font-medium text-gray-900 break-words line-clamp-2 leading-tight">
                      {conversation.title || "Untitled Chat"}
                    </p>
                    <div className="flex items-center space-x-2 mt-1.5">
                      <p className="text-xs text-gray-500 flex-shrink-0">
                        {conversation.messageCount || 0} messages
                      </p>
                      <span className="text-xs text-gray-400">•</span>
                      <p className="text-xs text-gray-400 truncate">
                        {formatDate(conversation.updatedAt)}
                      </p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6 text-gray-400 hover:text-red-500 hover:bg-red-50 flex-shrink-0 mt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(conversation);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer with conversation count */}
        {conversations.length > 0 && (
          <div className="p-3 border-t text-center">
            <p className="text-xs text-gray-500">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "
              {conversationToDelete?.title || "this conversation"}"? This action
              cannot be undone and all messages will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
