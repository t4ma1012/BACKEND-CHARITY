const Donation = require("../models/Donation");
const Campaign = require("../models/Campaign");
const crypto = require("crypto");

// Sinh mã chuyển khoản duy nhất: DONATE-<6 ký tự HEX>
const generateTransferContent = () => {
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 ký tự uppercase
  return `DONATE-${hex}`;
};

// Sinh VietQR URL
const generateQrUrl = (amount, transferContent) => {
  const bankCode = process.env.SEPAY_BANK_CODE;
  const accountNo = process.env.SEPAY_ACCOUNT_NO;
  const accountName = encodeURIComponent(process.env.SEPAY_ACCOUNT_NAME);
  const addInfo = encodeURIComponent(transferContent);
  return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
};

// POST /api/v1/payment/create
// Body: { campaignId, amount, message?, isAnonymous? }
exports.createPayment = async (req, res) => {
  try {
    const { campaignId, amount, message, isAnonymous } = req.body;

    if (!campaignId || !amount) {
      return res.status(400).json({ message: "Vui lòng cung cấp campaignId và số tiền" });
    }

    if (amount < 10000) {
      return res.status(400).json({ message: "Số tiền tối thiểu là 10.000đ" });
    }

    // Kiểm tra campaign phải đang ACTIVE
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Chiến dịch không tồn tại" });
    }
    if (campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Chiến dịch không còn nhận quyên góp" });
    }

    // Sinh mã chuyển khoản duy nhất
    let transferContent = generateTransferContent();
    // Đảm bảo unique
    while (await Donation.findOne({ transferContent })) {
      transferContent = generateTransferContent();
    }

    // Tạo Donation record
    const donation = await Donation.create({
      campaignId,
      donorId: req.user ? req.user._id : null,
      amount,
      message: message || "",
      isAnonymous: isAnonymous || false,
      transferContent,
      paymentStatus: "PENDING",
    });

    // Sinh QR URL
    const qrUrl = generateQrUrl(amount, transferContent);

    res.status(201).json({
      message: "Đã tạo giao dịch, vui lòng quét mã QR để thanh toán",
      payment: {
        _id: donation._id,
        qrCodeUrl: qrUrl,
        amount: donation.amount,
        transferContent,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// POST /api/v1/payment/webhook
// SePay gọi khi có tiền vào
exports.sepayWebhook = async (req, res) => {
  try {
    const { id, content, transferAmount, transferType } = req.body;

    // Chỉ xử lý giao dịch tiền vào
    if (transferType !== "in") {
      return res.status(200).json({ success: true });
    }

    // Idempotency: Kiểm tra trùng lặp bằng sepayTxId
    const existingByTxId = await Donation.findOne({ sepayTxId: String(id) });
    if (existingByTxId) {
      return res.status(200).json({ success: true });
    }

    // Regex parse content để tìm mã DONATE-XXXXXX (ngân hàng có thể bỏ dấu -)
    const match = content ? content.match(/DONATE-?([a-f0-9]{6})/i) : null;
    if (!match) {
      console.log("⚠️ Webhook: Không tìm thấy mã DONATE trong content:", content);
      return res.status(200).json({ success: true });
    }

    // Normalize lại thành DONATE-XXXXXX (có dấu -, uppercase) để khớp DB
    const transferContent = `DONATE-${match[1].toUpperCase()}`;
    console.log("🔍 Webhook: Parsed transferContent:", transferContent);

    // Tìm Donation bằng transferContent
    const donation = await Donation.findOne({ transferContent });
    if (!donation) {
      console.log("⚠️ Webhook: Không tìm thấy Donation với transferContent:", transferContent);
      return res.status(200).json({ success: true });
    }

    // Option B: Bỏ qua nếu donation đã FAILED hoặc SUCCESS
    if (donation.paymentStatus !== "PENDING") {
      console.log(`⚠️ Webhook: Donation ${donation._id} đang ${donation.paymentStatus}, bỏ qua`);
      return res.status(200).json({ success: true });
    }

    // Update Donation → SUCCESS
    donation.paymentStatus = "SUCCESS";
    donation.sepayTxId = String(id);
    await donation.save();

    // Cộng tiền cho Campaign (atomic $inc tránh race condition)
    const amountNum = Number(transferAmount);
    console.log(`💰 Webhook: transferAmount raw=${transferAmount}, parsed=${amountNum}`);
    
    const campaign = await Campaign.findByIdAndUpdate(
      donation.campaignId,
      { $inc: { currentBalance: amountNum } },
      { new: true } // trả về document sau khi update
    );
    console.log(`💰 Webhook: Campaign ${campaign?.displayId} currentBalance=${campaign?.currentBalance}`);
    
    if (campaign && campaign.currentBalance >= campaign.goalAmount) {
      await Campaign.findByIdAndUpdate(donation.campaignId, {
        $set: { status: "GOAL_REACHED" },
      });
    }

    // TODO: Blockchain — ghi hash lên smart contract (comment out chờ fix)
    // if (transferAmount >= 10000) {
    //   const txHash = await recordOnBlockchain(donation, campaign);
    //   donation.blockchainTxHash = txHash;
    //   await donation.save();
    // }

    console.log(`✅ Webhook: Donation ${donation._id} → SUCCESS, +${transferAmount}đ cho campaign ${campaign?.displayId}`);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    // Vẫn trả 200 để SePay không retry liên tục khi lỗi logic
    res.status(200).json({ success: true });
  }
};

// GET /api/v1/payment/status/:donationId
// FE polling mỗi 3 giây
exports.getPaymentStatus = async (req, res) => {
  try {
    const { donationId } = req.params;

    const donation = await Donation.findById(donationId);
    if (!donation) {
      return res.status(404).json({ message: "Không tìm thấy giao dịch" });
    }

    res.status(200).json({
      payment: {
        _id: donation._id,
        status: donation.paymentStatus,
        blockchainTxHash: donation.blockchainTxHash || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};