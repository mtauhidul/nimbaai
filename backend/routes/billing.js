// backend/routes/billing.js
const express = require("express");
const { authenticateUser } = require("../middleware/auth");

const router = express.Router();

// Placeholder routes
router.get("/credits", authenticateUser, (req, res) => {
  res.json({ credits: 0 });
});

router.post("/create-payment-intent", authenticateUser, (req, res) => {
  res.json({ message: "Payment intent created" });
});

router.get("/history", authenticateUser, (req, res) => {
  res.json({ transactions: [] });
});

module.exports = router;
