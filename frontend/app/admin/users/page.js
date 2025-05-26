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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  Activity,
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Coins,
  DollarSign,
  Eye,
  Filter,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

// Utility functions
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

export default function AdminUsers() {
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [tokenAction, setTokenAction] = useState("add");
  const [tokenAmount, setTokenAmount] = useState("");
  const [tokenReason, setTokenReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const { toast } = useToast();

  const fetchUsers = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const token = await user.getIdToken();
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        search,
        filter,
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
      setPagination(data.pagination || {});
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to fetch users: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setSelectedUser(data);
      setUserDetailsOpen(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch user details: " + error.message,
        variant: "destructive",
      });
    }
  };

  const updateUserTokens = async () => {
    if (!user || !selectedUser || !tokenAmount) return;

    try {
      setActionLoading(true);
      const token = await user.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${selectedUser.user.id}/tokens`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: tokenAction,
            amount: parseInt(tokenAmount),
            reason: tokenReason,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Tokens updated successfully. New balance: ${data.newBalance.toLocaleString()}`,
      });

      fetchUsers();
      setTokenDialogOpen(false);
      setTokenAmount("");
      setTokenReason("");
      setUserDetailsOpen(false);
    } catch (error) {
      console.error("Error updating tokens:", error);
      toast({
        title: "Error",
        description: "Failed to update user tokens: " + error.message,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user, page, search, filter]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleFilterChange = (value) => {
    setFilter(value);
    setPage(1);
  };

  const openTokenDialog = (userData, action) => {
    setSelectedUser({ user: userData });
    setTokenAction(action);
    setTokenDialogOpen(true);
  };

  // Calculate summary statistics
  const totalUsers = users.length;
  const verifiedUsers = users.filter((u) => u.emailVerified).length;
  const totalTokens = users.reduce((sum, u) => sum + (u.tokenBalance || 0), 0);
  const verificationRate =
    totalUsers > 0 ? (verifiedUsers / totalUsers) * 100 : 0;

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Page Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              User Management
            </h2>
            <p className="text-muted-foreground">
              Manage user accounts, tokens, and access permissions
            </p>
          </div>
          <Button onClick={fetchUsers} variant="outline" disabled={loading}>
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="px-4 lg:px-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers.toLocaleString()}
              </div>
              <div className="flex items-center pt-1">
                <Progress value={verificationRate} className="w-full h-2" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {verificationRate.toFixed(1)}% verified
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Verified Users
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {verifiedUsers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalUsers - verifiedUsers} pending verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Tokens
              </CardTitle>
              <Coins className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {(totalTokens / 1000000).toFixed(1)}M
              </div>
              <p className="text-xs text-muted-foreground">
                Avg:{" "}
                {totalUsers > 0
                  ? Math.round(totalTokens / totalUsers).toLocaleString()
                  : 0}{" "}
                per user
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {verificationRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                User engagement metric
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by email or name..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="verified">Verified Only</SelectItem>
                  <SelectItem value="unverified">Unverified Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 lg:px-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center text-red-600">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span>Error: {error}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users Table */}
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>
                  Users ({pagination.total?.toLocaleString() || 0})
                </CardTitle>
                <CardDescription>
                  {pagination.total > 0 && (
                    <>
                      Page {pagination.page || 1} of{" "}
                      {pagination.totalPages || 1}
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : users.length > 0 ? (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tokens</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((userData) => (
                        <TableRow key={userData.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={userData.photoURL} />
                                <AvatarFallback className="bg-blue-100 text-blue-600">
                                  {userData.email?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {userData.displayName || "No Name"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {userData.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {userData.emailVerified ? (
                                <Badge
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="flex items-center gap-1"
                                >
                                  <AlertCircle className="w-3 h-3 text-orange-600" />
                                  Unverified
                                </Badge>
                              )}
                              {userData.claudeOpusAccess && (
                                <Badge
                                  variant="outline"
                                  className="text-purple-600"
                                >
                                  <Shield className="w-3 h-3 mr-1" />
                                  Opus
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-purple-600" />
                              <span className="font-medium">
                                {userData.tokenBalance?.toLocaleString() || 0}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">
                                {userData.tokensUsed?.toLocaleString() || 0}{" "}
                                used
                              </div>
                              <div className="text-muted-foreground">
                                {userData.tokensPurchased?.toLocaleString() ||
                                  0}{" "}
                                purchased
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-muted-foreground">
                              {formatDate(userData.createdAt)}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => fetchUserDetails(userData.id)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openTokenDialog(userData, "add")}
                                className="text-green-600 hover:text-green-700"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  openTokenDialog(userData, "subtract")
                                }
                                className="text-red-600 hover:text-red-700"
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {pagination.total > 0 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                      {Math.min(
                        pagination.page * pagination.limit,
                        pagination.total
                      )}{" "}
                      of {pagination.total} users
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={!pagination.hasPrev || loading}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                          Page {pagination.page} of {pagination.totalPages}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={!pagination.hasNext || loading}
                      >
                        Next
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No users found
                </h3>
                <p className="text-muted-foreground">
                  {search || filter !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "No users have registered yet"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2" />
              User Details
            </DialogTitle>
            <DialogDescription>
              Complete information and activity for the selected user
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="purchases">Purchases</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4 mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Profile Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={selectedUser.user.photoURL} />
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                            {selectedUser.user.email?.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="text-lg font-semibold">
                            {selectedUser.user.displayName || "No Name Set"}
                          </h3>
                          <p className="text-muted-foreground">
                            {selectedUser.user.email}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Status
                            </span>
                            <Badge
                              variant={
                                selectedUser.user.emailVerified
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {selectedUser.user.emailVerified
                                ? "Verified"
                                : "Unverified"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Provider
                            </span>
                            <span className="font-medium">
                              {selectedUser.user.provider || "email"}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Joined
                            </span>
                            <span className="font-medium">
                              {formatDate(selectedUser.user.createdAt)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Last Active
                            </span>
                            <span className="font-medium">
                              {formatDate(selectedUser.user.lastActive)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Token Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-3xl font-bold text-purple-600">
                          {selectedUser.user.tokenBalance?.toLocaleString() ||
                            0}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Current Balance
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="font-semibold">
                            {selectedUser.user.tokensUsed?.toLocaleString() ||
                              0}
                          </div>
                          <div className="text-muted-foreground">Used</div>
                        </div>
                        <div className="text-center p-3 bg-muted rounded">
                          <div className="font-semibold">
                            {selectedUser.user.tokensPurchased?.toLocaleString() ||
                              0}
                          </div>
                          <div className="text-muted-foreground">Purchased</div>
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">
                          Token Utilization
                        </div>
                        <div className="text-lg font-semibold">
                          {selectedUser.stats?.tokenUtilization || 0}%
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="purchases" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Purchase History ({selectedUser.purchases?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedUser.purchases &&
                    selectedUser.purchases.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.purchases.slice(0, 10).map((purchase) => (
                          <div
                            key={purchase.id}
                            className="flex justify-between items-center p-4 bg-muted rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                <DollarSign className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">
                                  {purchase.currency === "USD" ? "$" : "৳"}
                                  {purchase.amount?.toLocaleString() || 0}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {purchase.tokens?.toLocaleString() || 0}{" "}
                                  tokens
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">
                                {formatDate(purchase.createdAt)}
                              </p>
                              <Badge variant="outline">
                                {purchase.currency}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No purchases yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Recent Conversations (
                      {selectedUser.conversations?.length || 0})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedUser.conversations &&
                    selectedUser.conversations.length > 0 ? (
                      <div className="space-y-3">
                        {selectedUser.conversations.map((conversation) => (
                          <div
                            key={conversation.id}
                            className="flex justify-between items-center p-4 bg-muted rounded-lg"
                          >
                            <div>
                              <p className="font-medium">
                                {conversation.title || "Untitled Conversation"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {conversation.messageCount || 0} messages
                              </p>
                            </div>
                            <div className="text-right text-sm text-muted-foreground">
                              <p>
                                Updated {formatDate(conversation.updatedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No conversations yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Token Update Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Coins className="w-5 h-5 mr-2" />
              {tokenAction === "add"
                ? "Add Tokens"
                : tokenAction === "subtract"
                ? "Remove Tokens"
                : "Set Tokens"}
            </DialogTitle>
            <DialogDescription>
              {tokenAction === "add"
                ? "Add tokens to user's balance"
                : tokenAction === "subtract"
                ? "Remove tokens from user's balance"
                : "Set user's token balance"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                value={tokenAmount}
                onChange={(e) => setTokenAmount(e.target.value)}
                placeholder="Enter token amount"
                min="1"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={tokenReason}
                onChange={(e) => setTokenReason(e.target.value)}
                placeholder="Reason for token adjustment..."
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setTokenDialogOpen(false);
                  setTokenAmount("");
                  setTokenReason("");
                }}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={updateUserTokens}
                disabled={
                  actionLoading || !tokenAmount || parseInt(tokenAmount) <= 0
                }
              >
                {actionLoading
                  ? "Updating..."
                  : tokenAction === "add"
                  ? "Add Tokens"
                  : tokenAction === "subtract"
                  ? "Remove Tokens"
                  : "Update Tokens"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
