"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle,
  Clock,
  Coins,
  CreditCard,
  DollarSign,
  ExternalLink,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

// Utility function to safely format dates
const formatDate = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    if (timestamp instanceof Date) return timestamp.toLocaleDateString();
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    if (timestamp.seconds)
      return new Date(timestamp.seconds * 1000).toLocaleDateString();
    return new Date(timestamp).toLocaleDateString();
  } catch (error) {
    return "N/A";
  }
};

const formatDateTime = (timestamp) => {
  if (!timestamp) return "N/A";
  try {
    if (timestamp instanceof Date) return timestamp.toLocaleString();
    if (timestamp.toDate) return timestamp.toDate().toLocaleString();
    if (timestamp.seconds)
      return new Date(timestamp.seconds * 1000).toLocaleString();
    return new Date(timestamp).toLocaleString();
  } catch (error) {
    return "N/A";
  }
};

export function AdminDataTable({ data }) {
  const [activeTab, setActiveTab] = useState("users");

  if (!data || !data.recentActivity) {
    return (
      <Card className="mx-4 lg:mx-6">
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent activity data available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { recentUsers = [], recentPurchases = [] } = data.recentActivity;

  return (
    <Card className="mx-4 lg:mx-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest user registrations and purchases on your platform
            </CardDescription>
          </div>
          <Link href="/admin/users">
            <Button variant="outline" size="sm">
              View All
              <ExternalLink className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Recent Users ({recentUsers.length})
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Recent Purchases ({recentPurchases.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            {recentUsers.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.photoURL} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {user.email?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-sm">
                                {user.displayName || "No Name"}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.emailVerified ? (
                            <Badge
                              variant="secondary"
                              className="flex items-center gap-1 w-fit"
                            >
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              Verified
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="flex items-center gap-1 w-fit"
                            >
                              <AlertCircle className="w-3 h-3 text-orange-600" />
                              Pending
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-purple-600" />
                            <span className="text-sm font-medium">
                              {user.tokenBalance?.toLocaleString() || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(user.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/users?search=${user.email}`}>
                            <Button variant="ghost" size="sm">
                              <ArrowUpRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent users found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="purchases" className="mt-4">
            {recentPurchases.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Tokens</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentPurchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium text-sm">
                                {purchase.userEmail}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Purchase #{purchase.id.slice(-6)}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold">
                            {purchase.currency === "USD" ? "$" : "৳"}
                            {purchase.amount?.toLocaleString() || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Coins className="w-3 h-3 text-purple-600" />
                            <span className="text-sm font-medium">
                              {purchase.tokens?.toLocaleString() || 0}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              purchase.currency === "USD"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {purchase.currency}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(purchase.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/admin/analytics?filter=purchases`}>
                            <Button variant="ghost" size="sm">
                              <ArrowUpRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No recent purchases found</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Summary Footer */}
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-blue-600">
                {recentUsers.length}
              </div>
              <div className="text-muted-foreground">Recent Users</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-green-600">
                {recentPurchases.length}
              </div>
              <div className="text-muted-foreground">Recent Purchases</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-purple-600">
                {recentPurchases
                  .reduce((sum, p) => sum + (p.tokens || 0), 0)
                  .toLocaleString()}
              </div>
              <div className="text-muted-foreground">Tokens Sold</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
