"use client";

import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import {
  ActivityIcon,
  BarChartIcon,
  CreditCardIcon,
  DatabaseIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  MonitorIcon,
  SettingsIcon,
  Shield,
  UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthState } from "react-firebase-hooks/auth";

import { NavMain } from "@/components/nav-main";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function AdminSidebar({ ...props }) {
  const [user] = useAuthState(auth);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/admin/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Navigation click handler
  const handleNavigation = (url) => {
    router.push(url);
  };

  const data = {
    user: {
      name: user?.displayName || "Administrator",
      email: user?.email || "admin@nimbaai.com",
      avatar: user?.photoURL || "",
    },
    navMain: [
      {
        title: "Dashboard",
        url: "/admin/dashboard",
        icon: LayoutDashboardIcon,
        isActive: pathname === "/admin/dashboard",
        onClick: () => handleNavigation("/admin/dashboard"),
      },
      {
        title: "Users",
        url: "/admin/users",
        icon: UsersIcon,
        isActive: pathname === "/admin/users",
        onClick: () => handleNavigation("/admin/users"),
      },
      {
        title: "Analytics",
        url: "/admin/analytics",
        icon: BarChartIcon,
        isActive: pathname === "/admin/analytics",
        onClick: () => handleNavigation("/admin/analytics"),
      },
      {
        title: "Settings",
        url: "/admin/settings",
        icon: SettingsIcon,
        isActive: pathname === "/admin/settings",
        onClick: () => handleNavigation("/admin/settings"),
      },
    ],
    navTools: [
      {
        title: "System Health",
        icon: MonitorIcon,
        url: "/admin/system",
        items: [
          {
            title: "Server Status",
            url: "/admin/system/status",
          },
          {
            title: "Performance",
            url: "/admin/system/performance",
          },
        ],
      },
      {
        title: "Billing",
        icon: CreditCardIcon,
        url: "/admin/billing",
        items: [
          {
            title: "Transactions",
            url: "/admin/billing/transactions",
          },
          {
            title: "Revenue Reports",
            url: "/admin/billing/reports",
          },
        ],
      },
      {
        title: "Database",
        icon: DatabaseIcon,
        url: "/admin/database",
        items: [
          {
            title: "Backup Manager",
            url: "/admin/database/backup",
          },
          {
            title: "Query Console",
            url: "/admin/database/console",
          },
        ],
      },
    ],
    navSecondary: [
      {
        title: "Back to App",
        url: "/chat",
        icon: ActivityIcon,
        onClick: () => handleNavigation("/chat"),
      },
      {
        title: "Documentation",
        url: "/admin/help",
        icon: HelpCircleIcon,
        onClick: () => handleNavigation("/admin/help"),
      },
    ],
  };

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/admin/dashboard" className="flex items-center p-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="text-base font-semibold">NimbaAI</span>
                  <div className="text-xs text-muted-foreground">
                    Control Panel
                  </div>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={data.user} onSignOut={handleSignOut} />
      </SidebarFooter>
    </Sidebar>
  );
}
