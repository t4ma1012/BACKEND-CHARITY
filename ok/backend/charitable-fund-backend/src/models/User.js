const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  avatar: { type: String },
  gender: { type: String, enum: ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'], default: 'UNKNOWN' },
  dob: { type: Date },
  phone: { type: String },
  bio: { type: String, maxlength: 255 },
  address: { type: String },
  socialLinks: { facebook: String, youtube: String, tiktok: String },
  accountType: { type: String, enum: ['INDIVIDUAL', 'ORGANIZATION'], default: 'INDIVIDUAL' },
  isVerified: { type: Boolean, default: false },
  kycStatus: { type: String, enum: ['NONE', 'PENDING', 'APPROVED', 'REJECTED'], default: 'NONE' },
  idCardFront: String,
  idCardBack: String,
  portrait: String,
  businessLicense: String,
  authLetter: String,
  repIdCard: String,
  tokenBlacklist: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);