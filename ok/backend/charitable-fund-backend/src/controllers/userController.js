const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const bcrypt = require('bcryptjs');

// GET /user/profile/me
const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -tokenBlacklist');

    // Thống kê dashboard
    const totalDonated = await Donation.aggregate([
      { $match: { donorId: req.user._id, paymentStatus: 'SUCCESS' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalDonations = await Donation.countDocuments({ 
      donorId: req.user._id, 
      paymentStatus: 'SUCCESS' 
    });

    const totalCampaigns = await Campaign.countDocuments({ 
      creatorId: req.user._id 
    });

    res.status(200).json({
      user,
      dashboard: {
        totalDonated: totalDonated[0]?.total || 0,
        totalDonations,
        totalCampaigns
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// PUT /user/profile/update
const updateProfile = async (req, res) => {
  try {
    const { gender, dob, phone, bio, address, socialLinks } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { gender, dob, phone, bio, address, socialLinks },
      { new: true }
    ).select('-password -tokenBlacklist');

    res.status(200).json({ message: 'Cập nhật thành công', user });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// PUT /user/password
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ' });
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// POST /user/kyc
const submitKyc = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.kycStatus === 'PENDING' || user.kycStatus === 'APPROVED') {
      return res.status(400).json({ message: 'Hồ sơ KYC đã được nộp hoặc đã duyệt' });
    }

    let kycData = {};
    if (user.accountType === 'INDIVIDUAL') {
      const { idCardFront, idCardBack, portrait } = req.body;
      if (!idCardFront || !idCardBack || !portrait) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ ảnh CCCD' });
      }
      kycData = { idCardFront, idCardBack, portrait };
    } else {
      const { businessLicense, authLetter, repIdCard } = req.body;
      if (!businessLicense || !authLetter || !repIdCard) {
        return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ hồ sơ tổ chức' });
      }
      kycData = { businessLicense, authLetter, repIdCard };
    }

    await User.findByIdAndUpdate(req.user._id, {
      ...kycData,
      kycStatus: 'PENDING'
    });

    res.status(201).json({ message: 'Nộp hồ sơ KYC thành công, đang chờ duyệt' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// GET /user/campaigns
const getMyCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find({ creatorId: req.user._id })
      .sort({ createdAt: -1 });

    res.status(200).json({ campaigns });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// GET /user/donations
const getMyDonations = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const donations = await Donation.find({ 
      donorId: req.user._id, 
      paymentStatus: 'SUCCESS' 
    })
      .populate('campaignId', 'title image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Tổng tiền theo từng chiến dịch
    const aggregate = await Donation.aggregate([
      { $match: { donorId: req.user._id, paymentStatus: 'SUCCESS' } },
      { $group: { _id: '$campaignId', total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const total = await Donation.countDocuments({ 
      donorId: req.user._id, 
      paymentStatus: 'SUCCESS' 
    });

    res.status(200).json({ 
      donations, 
      aggregate,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// GET /organizers
const getOrganizers = async (req, res) => {
  try {
    const { type, limit } = req.query;
    
    let filter = { isVerified: true };
    if (type) filter.accountType = type;

    const organizers = await User.find(filter)
      .select('name avatar accountType bio socialLinks')
      .limit(parseInt(limit) || 10);

    res.status(200).json({ organizers });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// XUẤT CÁC HÀM ĐỂ FILE ROUTE CÓ THỂ GỌI ĐƯỢC
module.exports = { 
  getMyProfile, 
  updateProfile, 
  changePassword, 
  submitKyc, 
  getMyCampaigns, 
  getMyDonations,
  getOrganizers
};