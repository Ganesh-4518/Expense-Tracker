const cron = require('node-cron');
const { pool } = require('../config/database');

const processRecurringTransactions = async () => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get all active recurring transactions that are due
        const result = await pool.query(
            `SELECT * FROM recurring_transactions 
             WHERE is_active = true AND next_run_date <= $1`,
            [today]
        );

        for (const recurring of result.rows) {
            try {
                // Insert the transaction into the appropriate table
                const table = recurring.type === 'income' ? 'incomes' : 'expenses';
                await pool.query(
                    `INSERT INTO ${table} (user_id, title, amount, category, description, date)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [recurring.user_id, recurring.title, recurring.amount, recurring.category,
                    recurring.description, recurring.next_run_date]
                );

                // Calculate next run date based on frequency
                let nextDate = new Date(recurring.next_run_date);
                switch (recurring.frequency) {
                    case 'daily':
                        nextDate.setDate(nextDate.getDate() + 1);
                        break;
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case 'monthly':
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        break;
                    case 'yearly':
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                        break;
                }

                // Update the next run date
                await pool.query(
                    'UPDATE recurring_transactions SET next_run_date = $1 WHERE id = $2',
                    [nextDate.toISOString().split('T')[0], recurring.id]
                );

                console.log(`✅ Recurring: Added ${recurring.type} "${recurring.title}" (₹${recurring.amount})`);
            } catch (err) {
                console.error(`❌ Error processing recurring transaction ${recurring.id}:`, err);
            }
        }

        if (result.rows.length > 0) {
            console.log(`📦 Processed ${result.rows.length} recurring transaction(s)`);
        }
    } catch (error) {
        console.error('Error in recurring transactions cron:', error);
    }
};

const startRecurringCron = () => {
    // Run every day at midnight
    cron.schedule('0 0 * * *', () => {
        console.log('🔄 Running recurring transactions check...');
        processRecurringTransactions();
    });
    console.log('⏰ Recurring transactions cron job scheduled');

    // Also run on startup to catch any missed
    processRecurringTransactions();
};

module.exports = { startRecurringCron };
