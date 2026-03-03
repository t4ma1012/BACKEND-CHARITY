const express = require('express');
const router = express.Router();
const { 
  createCampaign, 
  getCampaigns, 
  getCampaignById, 
  getDonationsByCampaign,
  updateCampaign, 
  closeCampaign 
} = require('../controllers/campaignController');
const { requireAuth } = require('../middlewares/auth');
const isVerified = require('../middlewares/isVerified');
const isOwner = require('../middlewares/isOwner');

router.post('/', requireAuth, isVerified, createCampaign);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);
router.get('/:id/donations', getDonationsByCampaign);
router.put('/:id/update', requireAuth, isOwner, updateCampaign);
router.put('/:id/close', requireAuth, isOwner, closeCampaign);

module.exports = router;