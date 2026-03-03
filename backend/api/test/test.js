require("dotenv").config();

const { recordDonationOnChain } = require("../src/utils/blockchain.js");

(async () => {
  const txHash = await recordDonationOnChain(
    "TEST_CAMPAIGN",
    100000,
    "hash_test"
  );
  console.log("TX:", txHash);
})();