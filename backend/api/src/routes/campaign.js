const express = require("express");
const router = express.Router();

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getDonationsByCampaign,
  updateCampaign,
  closeCampaign,
} = require("../controllers/campaignController");

const { requireAuth } = require("../middlewares/auth");
const isVerified = require("../middlewares/isVerified");
const isOwner = require("../middlewares/isOwner");

// =============================
// CREATE
// =============================
router.post("/", requireAuth, isVerified, createCampaign);

// =============================
// READ
// =============================
router.get("/", getCampaigns);
router.get("/:id", getCampaignById);
router.get("/:id/donations", getDonationsByCampaign);

// =============================
// UPDATE
// =============================
router.put("/:id/update", requireAuth, isOwner, updateCampaign);

// =============================
// CLOSE
// =============================
router.put("/:id/close", requireAuth, isOwner, closeCampaign);

module.exports = router;