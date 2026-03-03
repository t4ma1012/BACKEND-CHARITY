const mongoose = require('mongoose');

const disbursementSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['PENDING_TRANSFER', 'PENDING_VERIFY', 'COMPLETED', 'REJECTED'], 
    default: 'PENDING_TRANSFER' 
  },
  proofImages: [{ type: String }],
  proofETags: [{ type: String }],
  blockchainStatus: { type: String, enum: ['PENDING', 'SUCCESS', 'FAILED'], default: 'PENDING' },
  blockchainTxHash: String,
  reportHash: String
}, { timestamps: true });

module.exports = mongoose.model('Disbursement', disbursementSchema);