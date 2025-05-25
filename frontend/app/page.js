// app/page.js - Fixed version without store hydration issues
"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageSquare, Shield, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HomePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render anything until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-900 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-900">NimbaAI</span>
          </div>
          <div className="space-x-4">
            <Button variant="ghost" onClick={() => router.push("/auth/login")}>
              Login
            </Button>
            <Button
              onClick={() => router.push("/auth/register")}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-blue-900 mb-6">
          Access AI Models with{" "}
          <span className="text-blue-500">Flexible Pricing</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Chat with ChatGPT and Claude through our unified interface. Pay only
          for what you use or choose unlimited subscriptions.
        </p>
        <div className="space-x-4">
          <Button
            size="lg"
            onClick={() => router.push("/auth/register")}
            className="bg-blue-500 hover:bg-blue-600 px-8 py-3"
          >
            Start Chatting Free
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => router.push("/pricing")}
          >
            View Pricing
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle>Flexible Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Choose between credit packages or unlimited subscriptions.
                Credits never expire, use at your own pace.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle>Multiple AI Models</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Access GPT-3.5, GPT-4, and Claude models all in one place.
                Switch between models based on your needs.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-blue-500" />
              </div>
              <CardTitle>Personalized Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Our AI learns your preferences and provides contextual responses
                based on your conversation history.
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-900 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-200 mb-8">
            Join thousands of users already chatting with AI
          </p>
          <Button
            size="lg"
            onClick={() => router.push("/auth/register")}
            className="bg-blue-500 hover:bg-blue-600 px-8 py-3"
          >
            Create Free Account
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 NimbaAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
