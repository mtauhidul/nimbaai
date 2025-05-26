// components/EmailVerificationBanner.js
"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@/stores/authStore";
import { Mail, X, Zap } from "lucide-react";
import { useState } from "react";

export function EmailVerificationBanner() {
  const {
    emailVerified,
    freeTokensGranted,
    needsEmailVerification,
    checkEmailVerification,
  } = useAuthStore();

  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if email is verified and tokens are granted, or if dismissed
  if ((emailVerified && freeTokensGranted) || isDismissed) {
    return null;
  }

  const handleCheckVerification = async () => {
    setIsChecking(true);

    try {
      const result = await checkEmailVerification();

      if (result?.success && result?.tokensGranted) {
        toast({
          title: "🎉 Welcome to NimbaAI!",
          description: `You've received ${result.tokensGranted.toLocaleString()} free tokens to get started!`,
          duration: 6000,
        });
        setIsDismissed(true);
      } else if (result?.emailVerified === false) {
        toast({
          title: "Email Not Verified Yet",
          description:
            "Please check your email inbox and click the verification link.",
          variant: "destructive",
        });
      } else if (result?.freeTokensGranted) {
        toast({
          title: "Tokens Already Claimed",
          description:
            "Your free tokens have already been added to your account.",
        });
        setIsDismissed(true);
      }
    } catch (error) {
      toast({
        title: "Verification Check Failed",
        description:
          "Unable to check email verification status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Show different messages based on verification status
  if (!emailVerified) {
    return (
      <Alert className="mb-4 border-amber-200 bg-amber-50">
        <Mail className="h-4 w-4 text-amber-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>Verify your email to get 50,000 free tokens!</strong>
            <br />
            <span className="text-sm text-muted-foreground">
              Check your inbox and click the verification link to unlock your
              free tokens.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="border-amber-300 hover:bg-amber-100"
            >
              {isChecking ? "Checking..." : "I Verified It"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-amber-600 hover:bg-amber-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Email is verified but tokens not granted yet
  if (emailVerified && !freeTokensGranted) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <Zap className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <strong>🎉 Claim your 50,000 free tokens!</strong>
            <br />
            <span className="text-sm text-muted-foreground">
              Your email is verified! Click to claim your welcome tokens.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleCheckVerification}
              disabled={isChecking}
              className="bg-green-600 hover:bg-green-700"
            >
              {isChecking ? "Claiming..." : "Claim 50K Tokens"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-green-600 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
