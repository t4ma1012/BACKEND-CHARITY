import { ethers } from "hardhat";

async function main() {
  console.log("Deploying FundTransparency contract...");

  const FundTransparency = await ethers.getContractFactory("FundTransparency");

  // 👇 PHẢI GÁN vào biến contract
  const contract = await FundTransparency.deploy();

  // 👇 đợi deploy xong
  await contract.waitForDeployment();

  console.log("Deployer:", await contract.runner?.getAddress());
  console.log("Contract deployed to:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});