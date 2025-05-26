// components/chat/ChatHeader.js - Enhanced with Buy Tokens integration (keeping all existing functionality)
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
  CreditCard, // NEW: For Buy Tokens button
  Globe,
  LogOut,
  Mail,
  Menu,
  Plus,
  Settings,
  User,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation"; // NEW: For navigation
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
    preferredCurrency, // NEW: Currency preference
    checkEmailVerification,
    signOut: authSignOut,
  } = useAuthStore();

  const { toggleSidebar, openBillingModal } = useUIStore();
  const { selectedModel, availableModels } = useChatStore();
  const { toast } = useToast();
  const router = useRouter(); // NEW: For navigation
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  // NEW: Navigation handlers
  const handleBuyTokens = () => {
    router.push("/buy-tokens");
  };

  const handleBillingDashboard = () => {
    router.push("/billing");
  };

  // EXISTING: Keep all original handlers exactly as they were
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

  // EXISTING: Format token display (enhanced with currency info)
  const formatTokens = (tokenCount) => {
    if (tokenCount >= 1000000) {
      return `${(tokenCount / 1000000).toFixed(1)}M`;
    } else if (tokenCount >= 1000) {
      return `${(tokenCount / 1000).toFixed(1)}K`;
    }
    return tokenCount.toLocaleString();
  };

  // NEW: Currency display helpers
  const getCurrencyFlag = (currency) => {
    return currency === "USD" ? "🇺🇸" : "🇧🇩";
  };

  // EXISTING: Determine what to display (tokens or credits for backward compatibility)
  const displayTokens = tokens || (credits > 0 ? credits * 1000 : 0);
  const isUsingTokens = tokens > 0 || credits === 0;

  // NEW: Low balance detection
  const isLowBalance = displayTokens < 10000;
  const isVeryLowBalance = displayTokens < 1000;

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
        {/* EXISTING: Email Verification Alert - kept exactly as it was */}
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

        {/* EXISTING: Free Tokens Available Alert - kept exactly as it was */}
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

        {/* NEW: Currency indicator (only show if not using legacy credits) */}
        {isUsingTokens && (
          <div className="hidden md:flex items-center space-x-1 text-xs text-gray-500">
            <span>{getCurrencyFlag(preferredCurrency)}</span>
            <span>{preferredCurrency}</span>
          </div>
        )}

        {/* EXISTING: Token Balance Display - enhanced with currency info but keeping all original functionality */}
        <Button
          variant={canChat ? "outline" : "destructive"}
          size="sm"
          onClick={openBillingModal} // Keep original click handler for backward compatibility
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

        {/* ENHANCED: Low Token Warning with better thresholds */}
        {displayTokens > 0 && isLowBalance && canChat && (
          <Badge
            variant={isVeryLowBalance ? "destructive" : "secondary"}
            className={isVeryLowBalance ? "text-red-600" : "text-orange-600"}
          >
            {isVeryLowBalance ? "Very Low" : "Low Balance"}
          </Badge>
        )}

        {/* NEW: Buy Tokens Button (only show for token users) */}
        {isUsingTokens && (
          <Button
            onClick={handleBuyTokens}
            size="sm"
            className={`${
              isLowBalance
                ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" +
                  (isVeryLowBalance ? " animate-pulse" : "")
                : "bg-blue-600 hover:bg-blue-700"
            } text-white`}
          >
            <Plus className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Buy Tokens</span>
            <span className="sm:hidden">Buy</span>
          </Button>
        )}

        {/* EXISTING: User Menu - enhanced with new options but keeping all original functionality */}
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
            {/* EXISTING: User info section - enhanced with currency display */}
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              <div className="font-medium">
                {formatTokens(displayTokens)}{" "}
                {isUsingTokens ? "tokens" : "credits"} remaining
              </div>
              {/* NEW: Currency display for token users */}
              {isUsingTokens && (
                <div className="text-xs text-gray-500">
                  {getCurrencyFlag(preferredCurrency)} {preferredCurrency} •
                  {isLowBalance && (
                    <span
                      className={
                        isVeryLowBalance
                          ? "text-red-600 ml-1"
                          : "text-orange-600 ml-1"
                      }
                    >
                      {isVeryLowBalance ? "Very Low Balance" : "Low Balance"}
                    </span>
                  )}
                </div>
              )}
              {emailVerified ? (
                <div className="text-green-600 text-xs">✓ Email verified</div>
              ) : (
                <div className="text-amber-600 text-xs">
                  ⚠ Email not verified
                </div>
              )}
            </div>
            <DropdownMenuSeparator />

            {/* EXISTING: Settings - kept exactly as it was */}
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>

            {/* ENHANCED: Billing options - keeping original for backward compatibility, adding new options */}
            <DropdownMenuItem onClick={openBillingModal}>
              <CreditCard className="w-4 h-4 mr-2" />
              {isUsingTokens ? "Buy Tokens" : "Billing"}
            </DropdownMenuItem>

            {/* NEW: Additional billing options for token users */}
            {isUsingTokens && (
              <>
                <DropdownMenuItem onClick={handleBuyTokens}>
                  <Plus className="w-4 h-4 mr-2" />
                  Token Packages
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBillingDashboard}>
                  <Globe className="w-4 h-4 mr-2" />
                  Usage & History
                </DropdownMenuItem>
              </>
            )}

            {/* EXISTING: Email verification - kept exactly as it was */}
            {!emailVerified && (
              <DropdownMenuItem onClick={handleCheckEmailVerification}>
                <Mail className="w-4 h-4 mr-2" />
                Verify Email
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            {/* EXISTING: Sign out - kept exactly as it was */}
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
