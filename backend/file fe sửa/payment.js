const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middlewares/auth");
const {
  createPayment,
  sepayWebhook,
  getPaymentStatus
} = require("../controllers/paymentController");

// User tạo donation (cần login)
router.post("/create", requireAuth, createPayment);

// SePay gọi webhook (không cần auth — SePay gọi trực tiếp)
router.post("/webhook", sepayWebhook);

// FE polling trạng thái (cần login)
router.get("/status/:donationId", requireAuth, getPaymentStatus);

module.exports = router;