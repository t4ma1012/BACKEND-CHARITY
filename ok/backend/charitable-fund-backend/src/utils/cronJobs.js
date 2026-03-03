const cron = require('node-cron');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');

const startCronJobs = () => {
  // Chạy lúc 00:00 mỗi ngày — đóng campaign hết hạn
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Cron: Kiểm tra campaign hết hạn...');
    const now = new Date();
    const result = await Campaign.updateMany(
      { 
        endDate: { $lt: now }, 
        status: { $in: ['ACTIVE', 'GOAL_REACHED'] } 
      },
      { 
        $set: { status: 'CLOSED', closedAt: now } 
      }
    );
    console.log(`✅ Đã đóng ${result.modifiedCount} campaign hết hạn`);
  });

  // Chạy mỗi phút — đánh dấu donation PENDING quá 5 phút → FAILED
  cron.schedule('* * * * *', async () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const result = await Donation.updateMany(
      {
        paymentStatus: 'PENDING',
        createdAt: { $lt: fiveMinutesAgo },
      },
      {
        $set: { paymentStatus: 'FAILED' },
      }
    );
    if (result.modifiedCount > 0) {
      console.log(`⏰ Cron: Đã đánh dấu ${result.modifiedCount} donation PENDING quá hạn → FAILED`);
    }
  });
};

module.exports = startCronJobs;