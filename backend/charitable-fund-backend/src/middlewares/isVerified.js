const isVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ 
      message: 'Bạn cần xác minh KYC trước khi tạo chiến dịch' 
    });
  }
  next();
};

module.exports = isVerified;