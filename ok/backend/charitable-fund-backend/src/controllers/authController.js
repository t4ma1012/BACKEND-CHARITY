const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

const register = async (req, res) => {
  try {
    const { name, email, password, accountType } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email đã được sử dụng' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      accountType: accountType || 'INDIVIDUAL'
    });

    res.status(201).json({
      message: 'Đăng ký thành công',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountType: user.accountType,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' });
    }

    const { accessToken, refreshToken } = generateTokens(user._id);

    res.status(200).json({
      message: 'Đăng nhập thành công',
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        accountType: user.accountType,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(400).json({ message: 'Không có token' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      $push: { tokenBlacklist: token }
    });

    res.status(200).json({ message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Thiếu refresh token' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const accessToken = jwt.sign(
      { id: decoded.id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Refresh token không hợp lệ hoặc đã hết hạn' });
  }
};

module.exports = { register, login, logout, refresh };