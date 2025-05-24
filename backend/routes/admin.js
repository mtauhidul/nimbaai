// backend/routes/admin.js
const express = require("express");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// Admin middleware (add proper admin check later)
const requireAdmin = (req, res, next) => {
  // TODO: Check if user is admin
  next();
};

// Placeholder routes
router.get("/users", authenticateUser, requireAdmin, (req, res) => {
  res.json({ users: [] });
});

router.get("/analytics", authenticateUser, requireAdmin, (req, res) => {
  res.json({ analytics: {} });
});

module.exports = router;
