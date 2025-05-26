// components/chat/ChatInterface.js - Updated with token system
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

  // Updated to use token system
  const { tokens, credits, user, canChat, updateUserTokens, deductTokens } =
    useAuthStore();

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

  // Updated logic for token system
  const displayBalance = tokens || (credits > 0 ? credits * 1000 : 0);
  const isUsingTokens = tokens > 0 || credits === 0;
  const minimumTokensNeeded = 100;

  const canSendMessage =
    message.trim() &&
    !isLoading &&
    (isUsingTokens
      ? tokens >= minimumTokensNeeded
      : credits >= (currentModel?.cost || 1));

  // Debug current model and balance
  console.log("🔍 Current Model Object:", currentModel);
  console.log("🔍 Current Model ID:", selectedModel);
  console.log("🔍 Current Balance:", {
    tokens,
    credits,
    displayBalance,
    isUsingTokens,
  });

  const handleSendMessage = async () => {
    if (!canSendMessage) return;

    const userMessageContent = message.trim();
    setMessage("");
    setError(null);
    setLoading(true);

    // Debug: Log exactly what we're sending
    console.log("🚀 SENDING TO BACKEND:", {
      message: userMessageContent,
      model: selectedModel,
      conversationId: currentConversationId,
      currentModelObject: currentModel,
      tokenBalance: tokens,
      creditBalance: credits,
    });

    // Add user message to UI immediately
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    };

    addMessage(tempUserMessage);

    // Show loading toast with model name
    const loadingToast = toast.loading(`${currentModel?.name} is thinking...`, {
      description: isUsingTokens
        ? `Using tokens - Model: ${selectedModel}`
        : `Using ${currentModel?.cost} credit${
            currentModel?.cost > 1 ? "s" : ""
          } - Model: ${selectedModel}`,
    });

    try {
      // Send to backend
      const response = await apiClient.sendMessage(
        currentConversationId,
        userMessageContent,
        selectedModel
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
          // Add token usage data if available
          tokenUsage: response.tokenUsage,
          tokensUsed: response.tokensUsed,
        };

        // Add AI response to UI
        addMessage(aiMessage);

        // Update balance based on response
        if (response.tokensUsed && response.remainingTokens !== undefined) {
          // Token system response
          console.log("🪙 Tokens before:", tokens);
          console.log("🪙 Tokens used:", response.tokensUsed);
          console.log("🪙 Remaining tokens:", response.remainingTokens);

          updateUserTokens(response.remainingTokens);
        } else if (
          response.creditsUsed &&
          response.remainingCredits !== undefined
        ) {
          // Legacy credit system response
          console.log("💰 Credits before:", credits);
          console.log("💰 Credits used:", response.creditsUsed);
          console.log("💰 Remaining credits:", response.remainingCredits);

          // Use legacy method if it exists, otherwise update tokens
          if (typeof updateUserCredits === "function") {
            updateUserCredits(response.remainingCredits);
          } else {
            // Convert credits to tokens for display
            updateUserTokens(response.remainingCredits * 1000);
          }
        }

        // Update conversation ID if it's a new conversation
        if (response.conversationId && !currentConversationId) {
          useChatStore
            .getState()
            .setCurrentConversation(response.conversationId);
        }

        // Show success toast
        if (response.isError) {
          toast.warning("AI Response Generated", {
            description: `${response.aiProvider} had issues, but responded. No charges applied.`,
          });
        } else {
          const usageInfo = response.tokensUsed
            ? `${response.tokensUsed} tokens`
            : `${response.creditsUsed} credit${
                response.creditsUsed > 1 ? "s" : ""
              }`;

          const remainingInfo =
            response.remainingTokens !== undefined
              ? `${response.remainingTokens} tokens remaining`
              : `${response.remainingCredits} credits remaining`;

          toast.success(`${currentModel?.name} responded!`, {
            description: `Used ${usageInfo}. ${remainingInfo}`,
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

    const costInfo = isUsingTokens
      ? `Estimated: ${newModelConfig?.estimatedCost || "~100-500 tokens"}`
      : `Cost: ${newModelConfig?.cost} credit${
          newModelConfig?.cost > 1 ? "s" : ""
        } per message`;

    toast.info(`Switched to ${newModelConfig?.name}`, {
      description: costInfo,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Model Selector - Updated for token system */}
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
                        {isUsingTokens
                          ? model.estimatedCost || "~tokens"
                          : `${model.cost} credit${model.cost > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentModel && (
              <div className="text-xs text-gray-500">
                {isUsingTokens
                  ? `Estimated: ${
                      currentModel.estimatedCost || "~100-500 tokens"
                    }`
                  : `Cost: ${currentModel.cost} credit${
                      currentModel.cost > 1 ? "s" : ""
                    } per message`}
              </div>
            )}

            {/* Debug info - remove in production */}
            <div className="text-xs text-red-500">
              Selected: {selectedModel} | Balance: {displayBalance}{" "}
              {isUsingTokens ? "tokens" : "credits"}
            </div>
          </div>

          {/* Balance display */}
          <div className="text-sm text-gray-500">
            {isUsingTokens ? (
              <>
                Tokens: {tokens?.toLocaleString() || 0}
                {tokens < minimumTokensNeeded && (
                  <span className="text-red-500 ml-2">(Insufficient)</span>
                )}
              </>
            ) : (
              <>
                Credits: {credits || 0}
                {currentModel && credits < currentModel.cost && (
                  <span className="text-red-500 ml-2">(Insufficient)</span>
                )}
              </>
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
            {selectedModel} | Balance: {displayBalance}{" "}
            {isUsingTokens ? "tokens" : "credits"}
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
                    {isUsingTokens
                      ? currentModel.estimatedCost ||
                        "~100-500 tokens per message"
                      : `${currentModel.cost} credit${
                          currentModel.cost > 1 ? "s" : ""
                        } per message`}
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
                          {msg.tokensUsed && (
                            <>
                              <br />
                              Tokens Used: {msg.tokensUsed.toLocaleString()}
                            </>
                          )}
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

      {/* Input Area - Updated for token system */}
      <div className="border-t p-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex space-x-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                !canChat
                  ? isUsingTokens
                    ? "Insufficient tokens. Please get more tokens to continue."
                    : "No credits remaining. Please purchase more to continue."
                  : `Ask ${currentModel?.name} anything...${
                      isUsingTokens
                        ? ` (${currentModel?.estimatedCost || "~tokens"})`
                        : ` (${currentModel?.cost || 1} credit${
                            (currentModel?.cost || 1) > 1 ? "s" : ""
                          })`
                    }`
              }
              className="flex-1 min-h-[60px] max-h-32"
              disabled={isLoading || !canChat}
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

          {/* Status messages - Updated for token system */}
          {!canChat && (
            <p className="text-sm text-red-500 mt-2">
              {isUsingTokens
                ? "You don't have enough tokens. Please get more tokens to continue chatting."
                : "You have no credits left. Please purchase more to continue chatting."}
            </p>
          )}

          {isUsingTokens && tokens > 0 && tokens < minimumTokensNeeded && (
            <p className="text-sm text-orange-500 mt-2">
              Low token balance. You have {tokens.toLocaleString()} tokens, need
              at least {minimumTokensNeeded} to chat.
            </p>
          )}

          {!isUsingTokens &&
            currentModel &&
            credits > 0 &&
            credits < currentModel.cost && (
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
