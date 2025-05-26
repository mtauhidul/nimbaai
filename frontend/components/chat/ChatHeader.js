// components/chat/ChatHeader.js - Updated with token system
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { signOut } from "firebase/auth";
import {
  AlertCircle,
  Coins,
  CreditCard,
  LogOut,
  Mail,
  Menu,
  Settings,
  User,
  Zap,
} from "lucide-react";
import { useState } from "react";

export function ChatHeader() {
  const {
    user,
    tokens,
    credits, // Legacy fallback
    emailVerified,
    freeTokensGranted,
    needsEmailVerification,
    canChat,
    checkEmailVerification,
    signOut: authSignOut,
  } = useAuthStore();

  const { toggleSidebar, openBillingModal } = useUIStore();
  const { selectedModel, availableModels } = useChatStore();
  const { toast } = useToast();
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    authSignOut();
  };

  const handleCheckEmailVerification = async () => {
    setIsCheckingEmail(true);
    try {
      const result = await checkEmailVerification();

      if (result?.success && result?.tokensGranted) {
        toast({
          title: "🎉 Free Tokens Granted!",
          description: `You've received ${result.tokensGranted.toLocaleString()} free tokens for verifying your email!`,
          duration: 5000,
        });
      } else if (result?.emailVerified === false) {
        toast({
          title: "Email Not Verified",
          description:
            "Please check your email and click the verification link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check email verification. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const currentModel = availableModels.find((m) => m.id === selectedModel);

  // Format token display
  const formatTokens = (tokenCount) => {
    if (tokenCount >= 1000000) {
      return `${(tokenCount / 1000000).toFixed(1)}M`;
    } else if (tokenCount >= 1000) {
      return `${(tokenCount / 1000).toFixed(1)}K`;
    }
    return tokenCount.toLocaleString();
  };

  // Determine what to display (tokens or credits for backward compatibility)
  const displayTokens = tokens || (credits > 0 ? credits * 1000 : 0);
  const isUsingTokens = tokens > 0 || credits === 0;

  return (
    <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={toggleSidebar}>
          <Menu className="w-4 h-4" />
        </Button>

        <div className="flex items-center space-x-2">
          <span className="font-medium">NimbaAI</span>
          {currentModel && (
            <Badge variant="secondary">{currentModel.name}</Badge>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {/* Email Verification Alert */}
        {needsEmailVerification && !emailVerified && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckEmailVerification}
            disabled={isCheckingEmail}
            className="flex items-center space-x-2 text-amber-600 border-amber-200 hover:bg-amber-50"
          >
            <Mail className="w-4 h-4" />
            <span>{isCheckingEmail ? "Checking..." : "Verify Email"}</span>
          </Button>
        )}

        {/* Free Tokens Available Alert */}
        {emailVerified && !freeTokensGranted && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckEmailVerification}
            disabled={isCheckingEmail}
            className="flex items-center space-x-2 text-green-600 border-green-200 hover:bg-green-50"
          >
            <Zap className="w-4 h-4" />
            <span>{isCheckingEmail ? "Claiming..." : "Claim 50K Tokens"}</span>
          </Button>
        )}

        {/* Token Balance Display */}
        <Button
          variant={canChat ? "outline" : "destructive"}
          size="sm"
          onClick={openBillingModal}
          className="flex items-center space-x-2"
        >
          {canChat ? (
            <Coins className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>
            {isUsingTokens
              ? `${formatTokens(displayTokens)} tokens`
              : `${credits} credits`}
          </span>
        </Button>

        {/* Low Token Warning */}
        {displayTokens > 0 && displayTokens < 1000 && canChat && (
          <Badge variant="secondary" className="text-orange-600">
            Low Balance
          </Badge>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span className="max-w-32 truncate">
                {user?.displayName || user?.email}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              <div className="font-medium">
                {formatTokens(displayTokens)}{" "}
                {isUsingTokens ? "tokens" : "credits"} remaining
              </div>
              {emailVerified ? (
                <div className="text-green-600 text-xs">✓ Email verified</div>
              ) : (
                <div className="text-amber-600 text-xs">
                  ⚠ Email not verified
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openBillingModal}>
              <CreditCard className="w-4 h-4 mr-2" />
              {isUsingTokens ? "Buy Tokens" : "Billing"}
            </DropdownMenuItem>
            {!emailVerified && (
              <DropdownMenuItem onClick={handleCheckEmailVerification}>
                <Mail className="w-4 h-4 mr-2" />
                Verify Email
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
