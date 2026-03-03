// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract FundTransparency {
    
    event DonationRecorded(string campaignId, uint256 amount, string dataHash, uint256 timestamp);
    event DisbursementRecorded(string campaignId, uint256 amount, string reportHash, uint256 timestamp);
    
    function recordDonation(string memory campaignId, uint256 amount, string memory dataHash) public {
        emit DonationRecorded(campaignId, amount, dataHash, block.timestamp);
    }
    
    function recordDisbursement(string memory campaignId, uint256 amount, string memory reportHash) public {
        emit DisbursementRecorded(campaignId, amount, reportHash, block.timestamp);
    }
}