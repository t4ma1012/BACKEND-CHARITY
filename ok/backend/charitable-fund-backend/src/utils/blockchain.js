const { ethers } = require("ethers");
const abi = require("../abi/FundTransparency.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  abi,
  wallet
);

exports.recordDonationOnChain = async (campaignId, amount, hash) => {
  const tx = await contract.recordDonation(
    campaignId,
    ethers.parseEther(amount.toString()),
    hash
  );

  const receipt = await tx.wait();
  return receipt.hash;
};