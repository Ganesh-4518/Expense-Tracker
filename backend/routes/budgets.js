const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// @route   GET /api/budgets
// @desc    Get all budget goals for a month/year
router.get('/', async (req, res) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        const result = await pool.query(
            'SELECT * FROM budget_goals WHERE user_id = $1 AND month = $2 AND year = $3 ORDER BY category',
            [req.user.id, m, y]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get budgets error:', error);
        res.status(500).json({ message: 'Server error fetching budgets' });
    }
});

// @route   GET /api/budgets/status
// @desc    Get budgets with actual spending for progress bars
router.get('/status', async (req, res) => {
    try {
        const { month, year } = req.query;
        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        // Get budgets
        const budgets = await pool.query(
            'SELECT * FROM budget_goals WHERE user_id = $1 AND month = $2 AND year = $3 ORDER BY category',
            [req.user.id, m, y]
        );

        // Get actual spending per category for the month
        const spending = await pool.query(
            `SELECT category, COALESCE(SUM(amount), 0) as spent
             FROM expenses
             WHERE user_id = $1
               AND EXTRACT(MONTH FROM date) = $2
               AND EXTRACT(YEAR FROM date) = $3
             GROUP BY category`,
            [req.user.id, m, y]
        );

        const spendingMap = {};
        spending.rows.forEach(s => {
            spendingMap[s.category] = parseFloat(s.spent);
        });

        const result = budgets.rows.map(budget => ({
            ...budget,
            spent: spendingMap[budget.category] || 0,
            percentage: spendingMap[budget.category]
                ? Math.round((spendingMap[budget.category] / parseFloat(budget.amount)) * 100)
                : 0
        }));

        res.json(result);
    } catch (error) {
        console.error('Get budget status error:', error);
        res.status(500).json({ message: 'Server error fetching budget status' });
    }
});

// @route   POST /api/budgets
// @desc    Create a budget goal
router.post('/', async (req, res) => {
    try {
        const { category, amount, month, year } = req.body;

        if (!category || !amount) {
            return res.status(400).json({ message: 'Please provide category and amount' });
        }

        const m = parseInt(month) || new Date().getMonth() + 1;
        const y = parseInt(year) || new Date().getFullYear();

        // Check for duplicate
        const existing = await pool.query(
            'SELECT * FROM budget_goals WHERE user_id = $1 AND category = $2 AND month = $3 AND year = $4',
            [req.user.id, category, m, y]
        );
        if (existing.rows.length > 0) {
            return res.status(400).json({ message: 'Budget already exists for this category and month' });
        }

        const result = await pool.query(
            'INSERT INTO budget_goals (user_id, category, amount, month, year) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, category, amount, m, y]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create budget error:', error);
        res.status(500).json({ message: 'Server error creating budget' });
    }
});

// @route   PUT /api/budgets/:id
// @desc    Update a budget goal
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category, amount } = req.body;

        const check = await pool.query('SELECT * FROM budget_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        const result = await pool.query(
            'UPDATE budget_goals SET category = $1, amount = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [category || check.rows[0].category, amount || check.rows[0].amount, id, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update budget error:', error);
        res.status(500).json({ message: 'Server error updating budget' });
    }
});

// @route   DELETE /api/budgets/:id
// @desc    Delete a budget goal
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const check = await pool.query('SELECT * FROM budget_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Budget not found' });
        }

        await pool.query('DELETE FROM budget_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ message: 'Budget deleted successfully' });
    } catch (error) {
        console.error('Delete budget error:', error);
        res.status(500).json({ message: 'Server error deleting budget' });
    }
});

module.exports = router;
