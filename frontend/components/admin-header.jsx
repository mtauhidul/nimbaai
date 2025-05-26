"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { BellIcon, RefreshCwIcon, Shield } from "lucide-react";
import { usePathname } from "next/navigation";

// Page title mapping
const pageTitles = {
  "/admin/dashboard": "Dashboard Overview",
  "/admin/users": "User Management",
  "/admin/analytics": "Analytics & Reports",
  "/admin/settings": "System Settings",
};

// Page descriptions
const pageDescriptions = {
  "/admin/dashboard": "Monitor platform performance and key metrics",
  "/admin/users": "Manage user accounts and permissions",
  "/admin/analytics": "View detailed analytics and generate reports",
  "/admin/settings": "Configure system settings and preferences",
};

export function AdminHeader({ onRefresh, isRefreshing = false }) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] || "Admin Panel";
  const pageDescription = pageDescriptions[pathname];

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center gap-2 px-4 lg:gap-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-6"
        />

        {/* Page Title Section */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold">{pageTitle}</h1>
              {pageDescription && (
                <p className="text-sm text-muted-foreground">
                  {pageDescription}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Live Status Indicator */}
          <Badge
            variant="outline"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium">Live Data</span>
          </Badge>

          {/* Refresh Button - Only show on dashboard and analytics */}
          {(pathname === "/admin/dashboard" ||
            pathname === "/admin/analytics") &&
            onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={isRefreshing}
                className="hidden sm:flex"
              >
                <RefreshCwIcon
                  className={`w-4 h-4 mr-1.5 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
            )}

          {/* Notifications - Future feature */}
          <Button variant="ghost" size="sm" className="relative hidden md:flex">
            <BellIcon className="w-4 h-4" />
            {/* Notification dot */}
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </Button>

          {/* Admin Badge */}
          <Badge
            variant="secondary"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5"
          >
            <Shield className="w-3 h-3" />
            <span className="text-xs font-medium">Administrator</span>
          </Badge>
        </div>
      </div>
    </header>
  );
}
