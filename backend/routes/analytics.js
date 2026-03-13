const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/analytics/monthly-summary
// @desc    Get monthly income/expense summary for last 12 months
router.get('/monthly-summary', async (req, res) => {
    try {
        const incomeByMonth = await pool.query(`
            SELECT TO_CHAR(date, 'YYYY-MM') as month, 
                   TO_CHAR(date, 'Mon YYYY') as label,
                   COALESCE(SUM(amount), 0) as total
            FROM incomes WHERE user_id = $1 
            AND date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Mon YYYY')
            ORDER BY month ASC
        `, [req.user.id]);

        const expenseByMonth = await pool.query(`
            SELECT TO_CHAR(date, 'YYYY-MM') as month, 
                   TO_CHAR(date, 'Mon YYYY') as label,
                   COALESCE(SUM(amount), 0) as total
            FROM expenses WHERE user_id = $1 
            AND date >= CURRENT_DATE - INTERVAL '12 months'
            GROUP BY TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Mon YYYY')
            ORDER BY month ASC
        `, [req.user.id]);

        // Build a month map for last 12 months
        const months = [];
        for (let i = 11; i >= 0; i--) {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            const key = d.toISOString().slice(0, 7);
            const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            months.push({ month: key, label, income: 0, expense: 0 });
        }

        incomeByMonth.rows.forEach(row => {
            const m = months.find(m => m.month === row.month);
            if (m) m.income = parseFloat(row.total);
        });

        expenseByMonth.rows.forEach(row => {
            const m = months.find(m => m.month === row.month);
            if (m) m.expense = parseFloat(row.total);
        });

        res.json(months);
    } catch (error) {
        console.error('Analytics monthly-summary error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/analytics/category-trends
// @desc    Get expense breakdown by category for a given period
router.get('/category-trends', async (req, res) => {
    try {
        const { period = '6' } = req.query;
        const monthsBack = parseInt(period) || 6;

        const result = await pool.query(`
            SELECT category, 
                   TO_CHAR(date, 'YYYY-MM') as month,
                   TO_CHAR(date, 'Mon') as month_label,
                   COALESCE(SUM(amount), 0) as total
            FROM expenses WHERE user_id = $1 
            AND date >= CURRENT_DATE - INTERVAL '${monthsBack} months'
            GROUP BY category, TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Mon')
            ORDER BY month ASC, total DESC
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Analytics category-trends error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/analytics/top-categories
// @desc    Get top spending categories with totals
router.get('/top-categories', async (req, res) => {
    try {
        const { period = '6' } = req.query;
        const monthsBack = parseInt(period) || 6;

        const result = await pool.query(`
            SELECT category, 
                   COALESCE(SUM(amount), 0) as total,
                   COUNT(*) as count
            FROM expenses WHERE user_id = $1 
            AND date >= CURRENT_DATE - INTERVAL '${monthsBack} months'
            GROUP BY category
            ORDER BY total DESC
            LIMIT 8
        `, [req.user.id]);

        res.json(result.rows);
    } catch (error) {
        console.error('Analytics top-categories error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/analytics/stats
// @desc    Get overall financial stats
router.get('/stats', async (req, res) => {
    try {
        // Total income & expense all-time
        const totals = await pool.query(`
            SELECT 
                (SELECT COALESCE(SUM(amount), 0) FROM incomes WHERE user_id = $1) as total_income,
                (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE user_id = $1) as total_expense
        `, [req.user.id]);

        // Monthly averages (last 12 months)
        const avgIncome = await pool.query(`
            SELECT COALESCE(AVG(monthly_total), 0) as avg FROM (
                SELECT SUM(amount) as monthly_total
                FROM incomes WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY TO_CHAR(date, 'YYYY-MM')
            ) sub
        `, [req.user.id]);

        const avgExpense = await pool.query(`
            SELECT COALESCE(AVG(monthly_total), 0) as avg FROM (
                SELECT SUM(amount) as monthly_total
                FROM expenses WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '12 months'
                GROUP BY TO_CHAR(date, 'YYYY-MM')
            ) sub
        `, [req.user.id]);

        // Highest spending month
        const highestMonth = await pool.query(`
            SELECT TO_CHAR(date, 'Mon YYYY') as month, SUM(amount) as total
            FROM expenses WHERE user_id = $1
            GROUP BY TO_CHAR(date, 'YYYY-MM'), TO_CHAR(date, 'Mon YYYY')
            ORDER BY total DESC LIMIT 1
        `, [req.user.id]);

        // Transaction counts
        const counts = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM incomes WHERE user_id = $1) as income_count,
                (SELECT COUNT(*) FROM expenses WHERE user_id = $1) as expense_count
        `, [req.user.id]);

        const totalIncome = parseFloat(totals.rows[0].total_income);
        const totalExpense = parseFloat(totals.rows[0].total_expense);

        res.json({
            totalIncome,
            totalExpense,
            balance: totalIncome - totalExpense,
            savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : 0,
            avgMonthlyIncome: parseFloat(avgIncome.rows[0].avg).toFixed(0),
            avgMonthlyExpense: parseFloat(avgExpense.rows[0].avg).toFixed(0),
            highestSpendingMonth: highestMonth.rows[0] || null,
            totalTransactions: parseInt(counts.rows[0].income_count) + parseInt(counts.rows[0].expense_count)
        });
    } catch (error) {
        console.error('Analytics stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
