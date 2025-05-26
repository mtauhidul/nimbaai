"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle,
  Coins,
  Database,
  Eye,
  EyeOff,
  Globe,
  Lock,
  Mail,
  RefreshCw,
  Save,
  Server,
  Shield,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

export default function AdminSettings() {
  const [user] = useAuthState(auth);
  const [originalSettings, setOriginalSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [showApiKeys, setShowApiKeys] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    freeTokens: 50000,
    maintenanceMode: false,
    enabledModels: {
      "gpt-3.5-turbo": true,
      "gpt-4": true,
      "gpt-4-turbo": true,
      "claude-3-haiku": true,
      "claude-3-sonnet": true,
      "claude-3-opus": true,
    },
    claudeOpusRequirement: 300000,
    systemAnnouncement: "",
    rateLimits: {
      messagesPerHour: 100,
      tokensPerHour: 10000,
    },
    emailNotifications: true,
    backupEnabled: true,
    analyticsEnabled: true,
    maintenanceWindow: "02:00-04:00",
    maxUploadSize: 10,
    sessionTimeout: 24,
  });

  const fetchSettings = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      const token = await user.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // Store original settings for comparison
        setOriginalSettings(data);
        // Update form data with fetched settings
        setFormData((prev) => ({ ...prev, ...data }));
      } else {
        // If API fails, use default settings as original
        setOriginalSettings(formData);
        console.warn("Failed to fetch settings, using defaults");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      // Use default settings as fallback
      setOriginalSettings(formData);
      toast({
        title: "Warning",
        description: "Using default settings - couldn't connect to server",
        variant: "default",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const saveSettings = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const token = await user.getIdToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        // Update original settings to current form data
        setOriginalSettings({ ...formData });
        toast({
          title: "Success",
          description: "System settings updated successfully",
        });
      } else {
        throw new Error("Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to update system settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value,
      },
    }));
  };

  // Proper deep comparison for hasChanges
  const hasChanges = originalSettings
    ? JSON.stringify(originalSettings) !== JSON.stringify(formData)
    : false;

  if (loading) {
    return (
      <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
        <div className="px-4 lg:px-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="px-4 lg:px-6 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      {/* Header */}
      <div className="px-4 lg:px-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              System Settings
            </h2>
            <p className="text-muted-foreground">
              Configure system-wide settings and platform parameters
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSettings}
              disabled={refreshing}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              onClick={saveSettings}
              disabled={saving || !hasChanges}
              className={hasChanges ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      {/* Changes Alert */}
      {hasChanges && (
        <div className="px-4 lg:px-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Click "Save Changes" to apply them.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Maintenance Mode Alert */}
      {formData.maintenanceMode && (
        <div className="px-4 lg:px-6">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Maintenance Mode is ACTIVE!</strong> Users cannot access
              the chat interface.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Settings Tabs */}
      <div className="px-4 lg:px-6">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="models">AI Models</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coins className="w-5 h-5 mr-2" />
                  Token Configuration
                </CardTitle>
                <CardDescription>
                  Configure token allocation and distribution settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="freeTokens">Free Trial Tokens</Label>
                    <Input
                      id="freeTokens"
                      type="number"
                      value={formData.freeTokens}
                      onChange={(e) =>
                        handleInputChange(
                          "freeTokens",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="50000"
                    />
                    <p className="text-sm text-muted-foreground">
                      Number of free tokens granted to new verified users
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="claudeOpusRequirement">
                      Claude Opus Requirement
                    </Label>
                    <Input
                      id="claudeOpusRequirement"
                      type="number"
                      value={formData.claudeOpusRequirement}
                      onChange={(e) =>
                        handleInputChange(
                          "claudeOpusRequirement",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="300000"
                    />
                    <p className="text-sm text-muted-foreground">
                      Token purchase threshold for Claude Opus access
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable user access for maintenance
                      </p>
                    </div>
                    <Switch
                      checked={formData.maintenanceMode}
                      onCheckedChange={(value) =>
                        handleInputChange("maintenanceMode", value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maintenanceWindow">
                      Maintenance Window
                    </Label>
                    <Input
                      id="maintenanceWindow"
                      value={formData.maintenanceWindow}
                      onChange={(e) =>
                        handleInputChange("maintenanceWindow", e.target.value)
                      }
                      placeholder="02:00-04:00"
                    />
                    <p className="text-sm text-muted-foreground">
                      Preferred maintenance time window (UTC)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2" />
                  System Announcements
                </CardTitle>
                <CardDescription>
                  Display important messages to all users
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="systemAnnouncement">
                    Announcement Message
                  </Label>
                  <Textarea
                    id="systemAnnouncement"
                    value={formData.systemAnnouncement}
                    onChange={(e) =>
                      handleInputChange("systemAnnouncement", e.target.value)
                    }
                    placeholder="Enter system announcement message..."
                    rows={4}
                  />
                  <p className="text-sm text-muted-foreground">
                    This message will be displayed to all users. Leave empty to
                    hide.
                  </p>
                </div>

                {formData.systemAnnouncement && (
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <Alert>
                      <Bell className="h-4 w-4" />
                      <AlertDescription>
                        {formData.systemAnnouncement}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Models Settings */}
          <TabsContent value="models" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="w-5 h-5 mr-2" />
                  AI Model Configuration
                </CardTitle>
                <CardDescription>
                  Enable or disable AI models and configure their settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  {Object.entries(formData.enabledModels).map(
                    ([model, enabled]) => {
                      const modelName = model
                        .split("-")
                        .map(
                          (word) => word.charAt(0).toUpperCase() + word.slice(1)
                        )
                        .join(" ");

                      const isOpus = model === "claude-3-opus";
                      const isGPT4 = model.includes("gpt-4");

                      return (
                        <div
                          key={model}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Label className="text-base font-medium">
                                {modelName}
                              </Label>
                              {isOpus && (
                                <Badge
                                  variant="outline"
                                  className="text-purple-600"
                                >
                                  Premium
                                </Badge>
                              )}
                              {isGPT4 && (
                                <Badge
                                  variant="outline"
                                  className="text-blue-600"
                                >
                                  Advanced
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {model.startsWith("gpt")
                                ? "OpenAI GPT Model"
                                : "Anthropic Claude Model"}
                              {isOpus &&
                                " - Premium tier model with advanced capabilities"}
                              {isGPT4 &&
                                " - High-performance model with enhanced reasoning"}
                            </p>
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={(value) =>
                              handleNestedInputChange(
                                "enabledModels",
                                model,
                                value
                              )
                            }
                          />
                        </div>
                      );
                    }
                  )}
                </div>

                <Alert>
                  <Activity className="h-4 w-4" />
                  <AlertDescription>
                    Disabling models will prevent users from accessing them
                    immediately. Consider notifying users before making changes
                    to popular models.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Status Overview</CardTitle>
                <CardDescription>
                  Current status and usage statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(formData.enabledModels).map(
                    ([model, enabled]) => (
                      <div
                        key={model}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">
                            {model
                              .split("-")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1)
                              )
                              .join(" ")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {model.startsWith("gpt") ? "OpenAI" : "Anthropic"}
                          </p>
                        </div>
                        <Badge variant={enabled ? "default" : "secondary"}>
                          {enabled ? (
                            <>
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Disabled
                            </>
                          )}
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Rate Limiting
                </CardTitle>
                <CardDescription>
                  Configure usage limits to prevent abuse and ensure fair access
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="messagesPerHour">Messages Per Hour</Label>
                    <Input
                      id="messagesPerHour"
                      type="number"
                      value={formData.rateLimits.messagesPerHour}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "rateLimits",
                          "messagesPerHour",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="100"
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum messages a user can send per hour
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tokensPerHour">Tokens Per Hour</Label>
                    <Input
                      id="tokensPerHour"
                      type="number"
                      value={formData.rateLimits.tokensPerHour}
                      onChange={(e) =>
                        handleNestedInputChange(
                          "rateLimits",
                          "tokensPerHour",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="10000"
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum tokens a user can consume per hour
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
                    <Input
                      id="maxUploadSize"
                      type="number"
                      value={formData.maxUploadSize}
                      onChange={(e) =>
                        handleInputChange(
                          "maxUploadSize",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="10"
                    />
                    <p className="text-sm text-muted-foreground">
                      Maximum file upload size in megabytes
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">
                      Session Timeout (hours)
                    </Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={formData.sessionTimeout}
                      onChange={(e) =>
                        handleInputChange(
                          "sessionTimeout",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="24"
                    />
                    <p className="text-sm text-muted-foreground">
                      User session timeout in hours
                    </p>
                  </div>
                </div>

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Rate limits help prevent abuse and ensure fair usage. Adjust
                    based on your server capacity and user needs.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  API Keys & Security
                </CardTitle>
                <CardDescription>
                  Manage API keys and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Show API Keys</Label>
                    <p className="text-sm text-muted-foreground">
                      Toggle visibility of sensitive API key information
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowApiKeys(!showApiKeys)}
                  >
                    {showApiKeys ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">OpenAI API Key</p>
                      <p className="text-sm text-muted-foreground">
                        {showApiKeys ? "sk-..." : "••••••••••••••••"}
                      </p>
                    </div>
                    <Badge variant={showApiKeys ? "default" : "secondary"}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">Anthropic API Key</p>
                      <p className="text-sm text-muted-foreground">
                        {showApiKeys ? "ant-..." : "••••••••••••••••"}
                      </p>
                    </div>
                    <Badge variant={showApiKeys ? "default" : "secondary"}>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Notifications
                </CardTitle>
                <CardDescription>
                  Configure when and how to send email notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send email alerts for important events
                    </p>
                  </div>
                  <Switch
                    checked={formData.emailNotifications}
                    onCheckedChange={(value) =>
                      handleInputChange("emailNotifications", value)
                    }
                  />
                </div>

                {formData.emailNotifications && (
                  <div className="space-y-4 ml-6 border-l-2 border-muted pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">New user registrations</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Payment failures</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">System errors</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Daily usage reports</Label>
                      <Switch />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Settings */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  System Management
                </CardTitle>
                <CardDescription>
                  Advanced system settings and maintenance options
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Automatic Backups</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable automated daily backups
                      </p>
                    </div>
                    <Switch
                      checked={formData.backupEnabled}
                      onCheckedChange={(value) =>
                        handleInputChange("backupEnabled", value)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Analytics Collection</Label>
                      <p className="text-sm text-muted-foreground">
                        Collect usage analytics and metrics
                      </p>
                    </div>
                    <Switch
                      checked={formData.analyticsEnabled}
                      onCheckedChange={(value) =>
                        handleInputChange("analyticsEnabled", value)
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-medium">System Status</h4>
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4" />
                        <span className="text-sm">Server Status</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Online
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        <span className="text-sm">Database</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted rounded">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span className="text-sm">API Services</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Active
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions that require careful consideration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    These actions are permanent and cannot be undone. Proceed
                    with extreme caution.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full text-orange-600 border-orange-200 hover:bg-orange-50"
                  >
                    Reset All User Sessions
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Clear System Cache
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  >
                    Export All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
