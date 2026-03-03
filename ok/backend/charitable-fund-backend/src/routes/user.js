const express = require('express');
const router = express.Router();

// Import các hàm từ file controller bạn vừa tạo ở Bước 1
const { 
  getMyProfile, 
  updateProfile, 
  changePassword, 
  submitKyc, 
  getMyCampaigns, 
  getMyDonations,
  getOrganizers
} = require('../controllers/userController');

// Import middleware xác thực
const { requireAuth } = require('../middlewares/auth');

// Định nghĩa các route
router.get('/profile/me', requireAuth, getMyProfile);
router.put('/profile/update', requireAuth, updateProfile);
router.put('/password', requireAuth, changePassword);
router.post('/kyc', requireAuth, submitKyc);
router.get('/campaigns', requireAuth, getMyCampaigns);
router.get('/donations', requireAuth, getMyDonations);
router.get('/organizers', getOrganizers);  // public route

module.exports = router;