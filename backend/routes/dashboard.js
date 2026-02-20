const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/dashboard
// @desc    Get dashboard summary data
router.get('/', async (req, res) => {
    try {
        // Get total income
        const totalIncomeResult = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM incomes WHERE user_id = $1',
            [req.user.id]
        );
        const totalIncome = parseFloat(totalIncomeResult.rows[0].total);

        // Get total expense
        const totalExpenseResult = await pool.query(
            'SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = $1',
            [req.user.id]
        );
        const totalExpense = parseFloat(totalExpenseResult.rows[0].total);

        // Get last 7 days income data
        const incomeByDay = await pool.query(`
      SELECT DATE(date) as day, COALESCE(SUM(amount), 0) as total
      FROM incomes 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(date)
      ORDER BY day ASC
    `, [req.user.id]);

        // Get last 7 days expense data
        const expenseByDay = await pool.query(`
      SELECT DATE(date) as day, COALESCE(SUM(amount), 0) as total
      FROM expenses 
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(date)
      ORDER BY day ASC
    `, [req.user.id]);

        // Get recent transactions (last 5 of each)
        const recentIncomes = await pool.query(
            'SELECT id, title, amount, category, date, \'income\' as type FROM incomes WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 5',
            [req.user.id]
        );

        const recentExpenses = await pool.query(
            'SELECT id, title, amount, category, date, \'expense\' as type FROM expenses WHERE user_id = $1 ORDER BY date DESC, created_at DESC LIMIT 5',
            [req.user.id]
        );

        // Combine and sort recent transactions
        const recentTransactions = [...recentIncomes.rows, ...recentExpenses.rows]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);

        // Get income by category
        const incomeByCategory = await pool.query(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM incomes WHERE user_id = $1
      GROUP BY category
      ORDER BY total DESC
    `, [req.user.id]);

        // Get expense by category
        const expenseByCategory = await pool.query(`
      SELECT category, COALESCE(SUM(amount), 0) as total
      FROM expenses WHERE user_id = $1
      GROUP BY category
      ORDER BY total DESC
    `, [req.user.id]);

        res.json({
            summary: {
                totalIncome,
                totalExpense,
                balance: totalIncome - totalExpense
            },
            dailyData: {
                income: incomeByDay.rows,
                expense: expenseByDay.rows
            },
            recentTransactions,
            categoryData: {
                income: incomeByCategory.rows,
                expense: expenseByCategory.rows
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard data' });
    }
});

module.exports = router;
