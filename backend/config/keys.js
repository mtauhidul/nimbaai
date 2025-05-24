// backend/config/keys.js
module.exports = {
  // Firebase
  firebaseServiceAccount: process.env.FIREBASE_SERVICE_ACCOUNT,
  firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,

  // AI APIs
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,

  // Payment
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  sslcommerzStoreId: process.env.SSLCOMMERZ_STORE_ID,
  sslcommerzStorePassword: process.env.SSLCOMMERZ_STORE_PASSWORD,
  sslcommerzIsLive: process.env.SSLCOMMERZ_IS_LIVE === "true",

  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
};
