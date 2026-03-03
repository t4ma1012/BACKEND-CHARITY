const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  displayId: { type: String, required: true, unique: true },
  goalAmount: { type: Number, required: true },
  currentBalance: { type: Number, default: 0 },
  disbursedAmount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACTIVE', 'REJECTED', 'GOAL_REACHED', 'CLOSED'], 
    default: 'PENDING' 
  },
  endDate: { type: Date, required: true },
  startedAt: Date,
  closedAt: Date,
  embedding: { type: [Number] }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);