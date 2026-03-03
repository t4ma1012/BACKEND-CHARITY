require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth');
const campaignRoutes = require('./src/routes/campaign');
const userRoutes = require('./src/routes/user');
const adminRoutes = require('./src/routes/admin');
const paymentRoutes = require('./src/routes/payment');
const uploadRoutes = require('./src/routes/upload');
const startCronJobs = require('./src/utils/cronJobs');

const app = express();

connectDB();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: '✅ Server đang chạy!' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/campaign', campaignRoutes);
app.use('/api/v1/campaigns', campaignRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/payment', paymentRoutes);
app.use('/api/v1/upload', uploadRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route không tồn tại' });
});

startCronJobs();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server chạy tại http://localhost:${PORT}`);
});