const hre = require("hardhat");

async function main() {
  console.log("Deploying FundTransparency contract...");
  
  const FundTransparency = await hre.ethers.getContractFactory("FundTransparency");
  const contract = await FundTransparency.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("✅ Contract deployed to:", address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});