// frontend/lib/api.js - Enhanced with dual currency token purchase (keeping all existing code)
class ApiClient {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    if (typeof window !== "undefined") {
      const { getAuth } = await import("firebase/auth");
      const auth = getAuth();
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "API request failed");
      }

      return await response.json();
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  }

  // Auth endpoints
  async verifyAuth() {
    return this.request("/api/auth/verify");
  }

  // Token system endpoints
  async checkEmailVerification() {
    return this.request("/api/auth/check-email-verification", {
      method: "POST",
    });
  }

  async getTokenBalance() {
    return this.request("/api/auth/token-balance");
  }

  // Chat endpoints
  async sendMessage(conversationId, message, model = "gpt-3.5-turbo") {
    return this.request("/api/chat/message", {
      method: "POST",
      body: JSON.stringify({
        conversationId,
        message,
        model,
      }),
    });
  }

  async getConversations() {
    return this.request("/api/chat/conversations");
  }

  async getConversationMessages(conversationId) {
    return this.request(`/api/chat/conversations/${conversationId}/messages`);
  }

  async createConversation(title = "New Chat") {
    return this.request("/api/chat/conversations", {
      method: "POST",
      body: JSON.stringify({ title }),
    });
  }

  async deleteConversation(conversationId) {
    return this.request(`/api/chat/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }

  // EXISTING Billing endpoints (keeping all original functionality)
  async getUserCredits() {
    return this.request("/api/billing/credits");
  }

  async createPaymentIntent(amount, currency = "usd") {
    return this.request("/api/billing/create-payment-intent", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    });
  }

  async getPaymentHistory() {
    return this.request("/api/billing/history");
  }

  // NEW: Simple Dual Currency Token Purchase Methods (additions - won't break existing code)

  // Calculate custom token price
  async calculateTokenPrice(tokens, currency = "USD") {
    return this.request(
      `/api/billing/calculate-price?tokens=${tokens}&currency=${currency}`
    );
  }

  // Purchase tokens (mock payment)
  async purchaseTokens(tokens, currency = "USD", paymentMethod = "mock") {
    return this.request("/api/billing/purchase-tokens", {
      method: "POST",
      body: JSON.stringify({
        tokens,
        currency,
        paymentMethod,
      }),
    });
  }

  // Get purchase history
  async getPurchaseHistory(limit = 20) {
    return this.request(`/api/billing/purchase-history?limit=${limit}`);
  }
}

export const apiClient = new ApiClient();
