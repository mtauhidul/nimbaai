// backend/middleware/rateLimiter.js
const rateLimit = require("express-rate-limit");

// Basic rate limiter
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different rate limits for different endpoints
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 requests per window
  "Too many authentication attempts, please try again later"
);

const chatLimiter = createRateLimiter(
  60 * 1000, // 1 minute
  20, // 20 messages per minute
  "Too many messages, please slow down"
);

const generalLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests per window
  "Too many requests, please try again later"
);

module.exports = {
  authLimiter,
  chatLimiter,
  generalLimiter,
};
