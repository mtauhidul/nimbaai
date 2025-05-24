// components/chat/ChatHeader.js
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
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useUIStore } from "@/stores/uiStore";
import { signOut } from "firebase/auth";
import { Coins, CreditCard, LogOut, Menu, Settings, User } from "lucide-react";

export function ChatHeader() {
  const { user, credits, signOut: authSignOut } = useAuthStore();
  const { toggleSidebar, openBillingModal } = useUIStore();
  const { selectedModel, availableModels } = useChatStore();

  const handleSignOut = async () => {
    await signOut(auth);
    authSignOut();
  };

  const currentModel = availableModels.find((m) => m.id === selectedModel);

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

      <div className="flex items-center space-x-4">
        {/* Credits Display */}
        <Button
          variant="outline"
          size="sm"
          onClick={openBillingModal}
          className="flex items-center space-x-2"
        >
          <Coins className="w-4 h-4" />
          <span>{credits} credits</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <User className="w-4 h-4" />
              <span>{user?.displayName || user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={openBillingModal}>
              <CreditCard className="w-4 h-4 mr-2" />
              Billing
            </DropdownMenuItem>
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
