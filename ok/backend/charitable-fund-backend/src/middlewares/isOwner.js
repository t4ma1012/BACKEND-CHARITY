const Campaign = require('../models/Campaign');

const isOwner = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Chiến dịch không tồn tại' });
    }
    if (campaign.creatorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Bạn không có quyền thao tác chiến dịch này' });
    }
    req.campaign = campaign;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

module.exports = isOwner;