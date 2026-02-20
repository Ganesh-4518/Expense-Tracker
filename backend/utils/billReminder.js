const { pool } = require('../config/database');
const { sendBillReminderEmail } = require('./email');

// Check for upcoming bills and send email reminders
const checkAndSendReminders = async () => {
    try {
        console.log('🔔 Checking for bill reminders...');

        // Find all unpaid bills where (due_date - today) <= reminder_days
        const result = await pool.query(`
            SELECT br.*, u.email, u.name
            FROM bill_reminders br
            JOIN users u ON br.user_id = u.id
            WHERE br.is_paid = false
              AND br.due_date - CURRENT_DATE <= br.reminder_days
              AND br.due_date - CURRENT_DATE >= 0
        `);

        if (result.rows.length === 0) {
            console.log('✅ No bill reminders to send today.');
            return;
        }

        // Group bills by user
        const userBills = {};
        result.rows.forEach(bill => {
            if (!userBills[bill.email]) {
                userBills[bill.email] = {
                    name: bill.name,
                    email: bill.email,
                    bills: []
                };
            }
            userBills[bill.email].bills.push(bill);
        });

        // Send emails to each user
        for (const userData of Object.values(userBills)) {
            const emailResult = await sendBillReminderEmail(
                userData.email,
                userData.name,
                userData.bills
            );

            if (emailResult.success) {
                console.log(`✅ Reminder email sent to ${userData.email} for ${userData.bills.length} bill(s)`);
            } else {
                console.error(`❌ Failed to send reminder to ${userData.email}:`, emailResult.error);
            }
        }

        console.log('🔔 Bill reminder check complete.');
    } catch (error) {
        console.error('❌ Error checking bill reminders:', error.message);
    }
};

module.exports = { checkAndSendReminders };
