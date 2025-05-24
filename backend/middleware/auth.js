// backend/middleware/auth.js
const { auth } = require("../services/firebase-admin");

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Invalid token" });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split("Bearer ")[1];

    if (token) {
      const decodedToken = await auth.verifyIdToken(token);
      req.user = decodedToken;
    }

    next();
  } catch (error) {
    console.error("Optional auth error:", error);
    next();
  }
};

module.exports = {
  authenticateUser,
  optionalAuth,
};
