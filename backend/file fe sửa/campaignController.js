const Campaign = require("../models/Campaign");
const Donation = require("../models/Donation");

// =============================
// HELPER: Generate displayId (CAMP001)
// =============================
const generateDisplayId = async () => {
  const count = await Campaign.countDocuments();
  return `CAMP${String(count + 1).padStart(3, "0")}`;
};

// =============================
// CREATE CAMPAIGN
// POST /campaign
// =============================
const createCampaign = async (req, res) => {
  try {
    if (req.user.role === "ADMIN") {
      return res.status(403).json({
        message: "Admin không được phép tạo chiến dịch",
      });
    }

    const { title, description, goalAmount, endDate, image } = req.body;

    if (!title || !description || !goalAmount || !endDate || !image) {
      return res.status(400).json({
        message: "Vui lòng điền đầy đủ thông tin",
      });
    }

    const displayId = await generateDisplayId();

    const campaign = await Campaign.create({
      title,
      description,
      goalAmount,
      endDate,
      image,
      displayId,
      creatorId: req.user._id,
      currentBalance: 0,
      status: "PENDING",
    });

    res.status(201).json({
      message: "Tạo chiến dịch thành công, đang chờ duyệt",
      campaign,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// =============================
// GET CAMPAIGNS (List)
// GET /campaigns
// =============================
const getCampaigns = async (req, res) => {
  try {
    const { status } = req.query;

    let filter = {};

    if (status) {
      filter.status = { $in: status.split(",") };
    } else {
      filter.status = { $in: ["ACTIVE", "GOAL_REACHED"] };
    }

    const campaigns = await Campaign.find(filter)
      .populate("creatorId", "name avatar isVerified")
      .sort({ createdAt: -1 });

    res.status(200).json({ campaigns });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// =============================
// GET CAMPAIGN DETAIL
// GET /campaign/:id
// =============================
const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate("creatorId", "name avatar isVerified accountType");

    if (!campaign) {
      return res.status(404).json({
        message: "Chiến dịch không tồn tại",
      });
    }

    const progress =
      campaign.goalAmount > 0
        ? Math.round(
            (campaign.currentBalance / campaign.goalAmount) * 100
          )
        : 0;

    const totalDonations = await Donation.countDocuments({
      campaignId: campaign._id,
      paymentStatus: "SUCCESS",
    });

    res.status(200).json({
      campaign,
      progress,
      totalDonations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// =============================
// GET DONATIONS BY CAMPAIGN
// GET /campaign/:id/donations
// =============================
const getDonationsByCampaign = async (req, res) => {
  try {
    const donations = await Donation.find({
      campaignId: req.params.id,
      paymentStatus: "SUCCESS",
    })
      .populate("donorId", "name avatar")
      .sort({ createdAt: -1 });

    const result = donations.map((d) => {
      const obj = d.toObject();

      if (obj.isAnonymous) {
        obj.donorId = {
          name: "Người hảo tâm",
          avatar: null,
        };
      }

      return obj;
    });

    res.status(200).json({
      donations: result,
      total: result.length,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// =============================
// UPDATE CAMPAIGN
// PUT /campaign/:id/update
// =============================
const updateCampaign = async (req, res) => {
  try {
    const campaign = req.campaign;
    const { title, description } = req.body;

    if (campaign.status === "ACTIVE") {
      campaign.status = "PENDING";
    }

    if (title) campaign.title = title;
    if (description) campaign.description = description;

    await campaign.save();

    res.status(200).json({
      message:
        campaign.status === "PENDING"
          ? "Đã cập nhật, đang chờ duyệt lại"
          : "Cập nhật thành công",
      campaign,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

// =============================
// CLOSE CAMPAIGN
// PUT /campaign/:id/close
// =============================
const closeCampaign = async (req, res) => {
  try {
    const campaign = req.campaign;

    campaign.status = "CLOSED";
    campaign.closedAt = new Date();

    await campaign.save();

    res.status(200).json({
      message: "Đã đóng chiến dịch",
      campaign,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server",
      error: error.message,
    });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  getDonationsByCampaign,
  updateCampaign,
  closeCampaign,
};