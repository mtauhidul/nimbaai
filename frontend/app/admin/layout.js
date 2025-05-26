"use client";

import { AdminHeader } from "@/components/admin-header";
import { AdminSidebar } from "@/components/admin-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@/lib/firebase";
import { AlertCircle, Shield } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

export default function AdminLayout({ children }) {
  const [user, loading] = useAuthState(auth);
  const [adminVerified, setAdminVerified] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const verifyAdmin = async () => {
      if (!user && !loading) {
        router.push("/admin/login");
        return;
      }

      if (user) {
        try {
          const token = await user.getIdToken();
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/admin/dashboard`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (response.ok) {
            setAdminVerified(true);
          } else {
            throw new Error("Access denied. Admin privileges required.");
          }
        } catch (error) {
          console.error("Admin verification error:", error);
          setError(error.message);
          // Don't redirect immediately, show error first
          setTimeout(() => router.push("/admin/login"), 3000);
        }
      }
      setVerifying(false);
    };

    if (pathname !== "/admin/login") {
      verifyAdmin();
    } else {
      setVerifying(false);
    }
  }, [user, loading, router, pathname]);

  // Show login page if accessing admin login
  if (pathname === "/admin/login") {
    return children;
  }

  // Show loading while verifying admin access
  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Verifying Access
            </h3>
            <p className="text-gray-600">Checking admin privileges...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Access Denied
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <p className="text-sm text-gray-500 mb-4">
              Redirecting to login...
            </p>
            <Button
              onClick={() => router.push("/admin/login")}
              className="w-full"
            >
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show dashboard if admin verified
  if (!adminVerified) {
    return null;
  }

  return (
    <SidebarProvider>
      <AdminSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
