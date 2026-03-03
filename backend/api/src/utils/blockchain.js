require("dotenv").config();
const { ethers } = require("ethers");
const { abi } = require("../abi/FundTransparency.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Khai báo contractAddress lấy từ biến môi trường
const contractAddress = process.env.CONTRACT_ADDRESS;

// Khởi tạo contract với địa chỉ vừa lấy được
const contract = new ethers.Contract(contractAddress, abi, wallet);

exports.recordDonationOnChain = async (campaignId, amount, hash) => {
  try {
    console.log("🔗 Recording donation...");
    
    const tx = await contract.recordDonation(
      campaignId.toString(),
      Number(amount),
      hash
    );

    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ Donation recorded:", receipt.hash);

    return receipt.hash;

  } catch (err) {
    console.error("❌ Blockchain error:", err);
    throw err;
  }
};