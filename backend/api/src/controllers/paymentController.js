const Donation = require("../models/Donation");
const Campaign = require("../models/Campaign");
const crypto = require("crypto");

const generateTransferContent = () => {
  const hex = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `DONATE-${hex}`;
};

const generateQrUrl = (amount, transferContent) => {
  const bankCode = process.env.SEPAY_BANK_CODE;
  const accountNo = process.env.SEPAY_ACCOUNT_NO;
  const accountName = encodeURIComponent(process.env.SEPAY_ACCOUNT_NAME || "");
  const addInfo = encodeURIComponent(transferContent);
  return `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
};

exports.createPayment = async (req, res) => {
  try {
    const { campaignId, amount, message, isAnonymous } = req.body;

    if (!campaignId || !amount) {
      return res.status(400).json({ message: "Vui lòng cung cấp campaignId và số tiền" });
    }
    if (amount < 10000) {
      return res.status(400).json({ message: "Số tiền tối thiểu là 10.000đ" });
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Chiến dịch không tồn tại" });
    }
    if (campaign.status !== "ACTIVE") {
      return res.status(400).json({ message: "Chiến dịch không còn nhận quyên góp" });
    }

    let transferContent = generateTransferContent();
    while (await Donation.findOne({ transferContent })) {
      transferContent = generateTransferContent();
    }

    const donation = await Donation.create({
      campaignId,
      donorId: req.user ? req.user._id : null,
      amount,
      message: message || "",
      isAnonymous: isAnonymous || false,
      transferContent,
      paymentStatus: "PENDING",
    });

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
    console.error("❌ Create payment error:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

exports.sepayWebhook = async (req, res) => {
  try {
    console.log("🔥 WEBHOOK HIT");
    console.log("📩 Headers:", req.headers);
    console.log("📩 Body:", req.body);

    // ✅ SePay gửi header: "Apikey YOUR_SECRET"
    const authHeader = req.headers["authorization"] || "";
    const secret = authHeader.replace(/^Apikey\s+/i, "").trim();

    if (secret !== process.env.SEPAY_WEBHOOK_SECRET) {
      console.log("🚫 Invalid secret. Received:", authHeader);
      console.log("🚫 Expected:", process.env.SEPAY_WEBHOOK_SECRET);
      return res.status(403).json({ message: "Forbidden" });
    }

    const { id, content, transferAmount, transferType } = req.body;

    // Chỉ xử lý tiền vào
    if (transferType !== "in") {
      console.log("⏭️ Bỏ qua giao dịch không phải tiền vào");
      return res.status(200).json({ success: true });
    }

    // Idempotency check
    if (id) {
      const existing = await Donation.findOne({ sepayTxId: String(id) });
      if (existing) {
        console.log("⚠️ Duplicate webhook, bỏ qua");
        return res.status(200).json({ success: true });
      }
    }

    // Parse mã DONATE-XXXXXX từ content
    const match = content ? content.match(/DONATE-?([a-f0-9]{6})/i) : null;
    if (!match) {
      console.log("⚠️ Không tìm thấy mã DONATE trong content:", content);
      return res.status(200).json({ success: true });
    }

    const transferContent = `DONATE-${match[1].toUpperCase()}`;
    console.log("🔍 Parsed transferContent:", transferContent);

    // Tìm donation
    const donation = await Donation.findOne({ transferContent });
    if (!donation) {
      console.log("⚠️ Không tìm thấy Donation:", transferContent);
      return res.status(200).json({ success: true });
    }

    if (donation.paymentStatus !== "PENDING") {
      console.log(`⚠️ Donation ${donation._id} đã ${donation.paymentStatus}`);
      return res.status(200).json({ success: true });
    }

    // Tạo hash SHA256
    const timestamp = Date.now();
    const dataHash = crypto
      .createHash("sha256")
      .update(`${donation.campaignId}${transferAmount}${id}${timestamp}`)
      .digest("hex");

    // Update donation
    donation.paymentStatus = "SUCCESS";
    donation.sepayTxId = id ? String(id) : null;
    donation.dataHash = dataHash;
    await donation.save();

    // Cộng tiền campaign
    const amountNum = Number(transferAmount);
    const campaign = await Campaign.findByIdAndUpdate(
      donation.campaignId,
      { $inc: { currentBalance: amountNum } },
      { new: true }
    );

    if (campaign && campaign.currentBalance >= campaign.goalAmount) {
      await Campaign.findByIdAndUpdate(donation.campaignId, {
        $set: { status: "GOAL_REACHED" },
      });
    }

    console.log(`🎉 Donation ${donation._id} SUCCESS +${amountNum}đ`);

    // Ghi blockchain async (không block response)
    setImmediate(async () => {
      try {
        const { recordDonationOnChain } = require("../utils/blockchain");
        const txHash = await recordDonationOnChain(
          campaign.displayId,
          amountNum,
          dataHash
        );
        await Donation.findByIdAndUpdate(donation._id, {
          blockchainTxHash: txHash,
          blockchainStatus: "SUCCESS",
        });
        console.log("✅ Blockchain recorded:", txHash);
      } catch (blockchainErr) {
        console.error("❌ Blockchain error:", blockchainErr.message);
        await Donation.findByIdAndUpdate(donation._id, {
          blockchainStatus: "FAILED",
        });
      }
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Webhook error:", err);
    return res.status(200).json({ success: true });
  }
};

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
        blockchainStatus: donation.blockchainStatus || null,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};