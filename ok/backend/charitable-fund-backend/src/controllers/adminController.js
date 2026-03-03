const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Disbursement = require('../models/Disbursement');

const getKycList = async (req, res) => {
  try {
    const users = await User.find({ kycStatus: 'PENDING' })
      .select('-password -tokenBlacklist');
    res.status(200).json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message });
  }
};

const approveKyc = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { kycStatus: status };
    if (status === 'APPROVED') updateData.isVerified = true;
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .select('-password -tokenBlacklist');
    if (!user) return res.status(404).json({ message: 'User khong ton tai' });
    res.status(200).json({ message: `KYC ${status}`, user });
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message });
  }
};

const approveCampaign = async (req, res) => {
  try {
    const { status } = req.body;
    const updateData = { status };
    if (status === 'ACTIVE') updateData.startedAt = new Date();
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!campaign) return res.status(404).json({ message: 'Campaign khong ton tai' });
    res.status(200).json({ message: `Campaign ${status}`, campaign });
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message });
  }
};

const confirmTransfer = async (req, res) => {
  try {
    const disbursement = await Disbursement.findByIdAndUpdate(
      req.params.id,
      { status: 'PENDING_VERIFY' },
      { new: true }
    );
    if (!disbursement) return res.status(404).json({ message: 'Disbursement khong ton tai' });
    res.status(200).json({ message: 'Da xac nhan chuyen khoan', disbursement });
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message });
  }
};

const verifyDisbursement = async (req, res) => {
  try {
    const disbursement = await Disbursement.findByIdAndUpdate(
      req.params.id,
      { status: 'COMPLETED' },
      { new: true }
    );
    if (!disbursement) return res.status(404).json({ message: 'Disbursement khong ton tai' });
    res.status(200).json({ message: 'Da duyet minh chung', disbursement });
  } catch (error) {
    res.status(500).json({ message: 'Loi server', error: error.message });
  }
};

module.exports = { getKycList, approveKyc, approveCampaign, confirmTransfer, verifyDisbursement };