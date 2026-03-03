const express = require('express');
const router = express.Router();
const { 
  getKycList, 
  approveKyc, 
  approveCampaign, 
  confirmTransfer, 
  verifyDisbursement 
} = require('../controllers/adminController');
const { requireAuth, requireAdmin } = require('../middlewares/auth');

router.use(requireAuth, requireAdmin);

router.get('/kyc-list', getKycList);
router.put('/user/:id/kyc', approveKyc);
router.put('/campaign/:id/approve', approveCampaign);
router.put('/disbursement/:id/transfer', confirmTransfer);
router.put('/disbursement/:id/verify', verifyDisbursement);

module.exports = router;