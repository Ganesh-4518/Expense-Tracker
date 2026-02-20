const cron = require('node-cron');
const { checkAndSendReminders } = require('../utils/billReminder');

// Start the bill reminder cron job
const startReminderCron = () => {
    // Run daily at 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log('⏰ Running daily bill reminder check...');
        await checkAndSendReminders();
    });

    console.log('📅 Bill reminder cron job scheduled (daily at 8:00 AM)');
};

module.exports = { startReminderCron };
