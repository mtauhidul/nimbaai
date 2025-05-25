// components/chat/ChatInterface.js - Debug Model Selection
"use client";

import ClientOnly from "@/components/ClientOnly";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { apiClient } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { AlertCircle, Bot, Loader2, Send, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

function ChatInterfaceContent() {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(null);

  const {
    messages,
    isLoading,
    selectedModel,
    availableModels,
    currentConversationId,
    addMessage,
    setSelectedModel,
    setLoading,
  } = useChatStore();

  const { credits, user, updateUserCredits } = useAuthStore();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Debug: Log when selectedModel changes
  useEffect(() => {
    console.log("🔍 Selected Model Changed:", selectedModel);
    console.log("🔍 Available Models:", availableModels);
  }, [selectedModel, availableModels]);

  // Get current model configuration
  const currentModel = availableModels.find((m) => m.id === selectedModel);
  const canSendMessage =
    message.trim() && !isLoading && credits >= (currentModel?.cost || 1);

  // Debug current model
  console.log("🔍 Current Model Object:", currentModel);
  console.log("🔍 Current Model ID:", selectedModel);
  console.log("🔍 Current Credits:", credits);

  const handleSendMessage = async () => {
    if (!canSendMessage) return;

    const userMessageContent = message.trim();
    setMessage("");
    setError(null);
    setLoading(true);

    // Debug: Log exactly what we're sending
    console.log("🚀 SENDING TO BACKEND:", {
      message: userMessageContent,
      model: selectedModel, // This should match what user selected
      conversationId: currentConversationId,
      currentModelObject: currentModel,
    });

    // Add user message to UI immediately
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    };

    addMessage(tempUserMessage);

    // Show loading toast with correct model name
    const loadingToast = toast.loading(`${currentModel?.name} is thinking...`, {
      description: `Using ${currentModel?.cost} credit${
        currentModel?.cost > 1 ? "s" : ""
      } - Model: ${selectedModel}`,
    });

    try {
      // Send to real backend - Make sure we're sending the right model
      const response = await apiClient.sendMessage(
        currentConversationId,
        userMessageContent,
        selectedModel // This should be exactly what user selected
      );

      console.log("✅ Backend Response Model:", response.aiMessage?.model);
      console.log("✅ Expected Model:", selectedModel);
      console.log("✅ Full Backend response:", response);

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      if (response.success) {
        // Create AI message object
        const aiMessage = {
          id: response.aiMessage.id,
          role: "assistant",
          content: response.aiMessage.content,
          timestamp: response.aiMessage.timestamp,
          model: response.aiMessage.model,
        };

        // Add AI response to UI
        addMessage(aiMessage);

        // Update credits - Use the response credits, not the local calculation
        console.log("💰 Credits before:", credits);
        console.log(
          "💰 Credits after (from backend):",
          response.remainingCredits
        );
        updateUserCredits(response.remainingCredits);

        // Update conversation ID if it's a new conversation
        if (response.conversationId && !currentConversationId) {
          useChatStore
            .getState()
            .setCurrentConversation(response.conversationId);
        }

        // Show success toast
        if (response.isError) {
          toast.warning("AI Response Generated", {
            description: `${response.aiProvider} had issues, but responded. No credits charged.`,
          });
        } else {
          toast.success(`${currentModel?.name} responded!`, {
            description: `Used ${response.creditsUsed} credit${
              response.creditsUsed > 1 ? "s" : ""
            }. ${response.remainingCredits} remaining.`,
          });
        }
      } else {
        throw new Error(response.error || "Failed to send message");
      }
    } catch (error) {
      console.error("❌ Error sending message:", error);
      toast.dismiss(loadingToast);
      setError(error.message || "Failed to send message. Please try again.");
      setMessage(userMessageContent);
      toast.error("Failed to send message", {
        description:
          error.message || "Please check your connection and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleModelChange = (newModel) => {
    console.log("🔄 Model Change:", selectedModel, "→", newModel);
    setSelectedModel(newModel);
    setError(null);

    const newModelConfig = availableModels.find((m) => m.id === newModel);
    console.log("🔄 New Model Config:", newModelConfig);

    toast.info(`Switched to ${newModelConfig?.name}`, {
      description: `Cost: ${newModelConfig?.cost} credit${
        newModelConfig?.cost > 1 ? "s" : ""
      } per message`,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Model Selector */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Select value={selectedModel} onValueChange={handleModelChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{model.name}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {model.cost} credit{model.cost > 1 ? "s" : ""}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentModel && (
              <div className="text-xs text-gray-500">
                Cost: {currentModel.cost} credit
                {currentModel.cost > 1 ? "s" : ""} per message
              </div>
            )}

            {/* Debug info */}
            <div className="text-xs text-red-500">
              Selected: {selectedModel} | Cost: {currentModel?.cost}
            </div>
          </div>

          {/* Single credits display */}
          <div className="text-sm text-gray-500">
            Credits: {credits || 0}
            {currentModel && credits < currentModel.cost && (
              <span className="text-red-500 ml-2">(Insufficient)</span>
            )}
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {/* Debug: Show message count */}
          <div className="text-xs text-gray-400 text-center">
            Messages in store: {messages.length} | Selected Model:{" "}
            {selectedModel}
          </div>

          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
              <p className="mb-2">Send a message to begin chatting with AI</p>
              {currentModel && (
                <div className="space-y-1">
                  <p className="text-sm">
                    Using{" "}
                    <span className="font-medium">{currentModel.name}</span>
                  </p>
                  <p className="text-xs">
                    {currentModel.cost} credit{currentModel.cost > 1 ? "s" : ""}{" "}
                    per message
                  </p>
                  <p className="text-xs text-red-500">
                    Model ID: {selectedModel}
                  </p>
                </div>
              )}
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start space-x-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}

                <div
                  className={`max-w-2xl rounded-lg px-4 py-2 ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-white border"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div>
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                      {msg.model && (
                        <div className="text-xs text-gray-400 mt-2 pt-2 border-t">
                          Model Used:{" "}
                          {availableModels.find((m) => m.id === msg.model)
                            ?.name || msg.model}
                          <br />
                          Model ID: {msg.model}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div className="bg-white border rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {currentModel?.name} ({selectedModel}) is thinking...
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex space-x-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                credits <= 0
                  ? "No credits remaining. Please purchase more to continue."
                  : `Ask ${currentModel?.name} anything... (${
                      currentModel?.cost || 1
                    } credit${(currentModel?.cost || 1) > 1 ? "s" : ""})`
              }
              className="flex-1 min-h-[60px] max-h-32"
              disabled={isLoading || credits <= 0}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!canSendMessage}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Status messages */}
          {credits <= 0 && (
            <p className="text-sm text-red-500 mt-2">
              You have no credits left. Please purchase more to continue
              chatting.
            </p>
          )}

          {currentModel && credits > 0 && credits < currentModel.cost && (
            <p className="text-sm text-orange-500 mt-2">
              Insufficient credits for {currentModel.name}. Need{" "}
              {currentModel.cost} credits, you have {credits}.
            </p>
          )}

          {isLoading && (
            <p className="text-sm text-blue-500 mt-2">
              Generating response with {currentModel?.name} ({selectedModel})...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatInterface() {
  return (
    <ClientOnly
      fallback={
        <div className="flex flex-col h-full items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">Loading chat...</p>
        </div>
      }
    >
      <ChatInterfaceContent />
    </ClientOnly>
  );
}
