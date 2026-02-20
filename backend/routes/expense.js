const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/expenses
// @desc    Get all expenses for logged in user
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM expenses WHERE user_id = $1 ORDER BY date DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({ message: 'Server error fetching expenses' });
    }
});

// @route   POST /api/expenses
// @desc    Add new expense
router.post('/', async (req, res) => {
    try {
        const { title, amount, category, description, date } = req.body;

        if (!title || !amount || !date) {
            return res.status(400).json({ message: 'Please provide title, amount, and date' });
        }

        const result = await pool.query(
            'INSERT INTO expenses (user_id, title, amount, category, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, title, amount, category || 'Other', description || '', date]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Add expense error:', error);
        res.status(500).json({ message: 'Server error adding expense' });
    }
});

// @route   PUT /api/expenses/:id
// @desc    Update expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, category, description, date } = req.body;

        // Check if expense belongs to user
        const check = await pool.query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        const result = await pool.query(
            'UPDATE expenses SET title = $1, amount = $2, category = $3, description = $4, date = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
            [title, amount, category, description, date, id, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({ message: 'Server error updating expense' });
    }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if expense belongs to user
        const check = await pool.query('SELECT * FROM expenses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Expense not found' });
        }

        await pool.query('DELETE FROM expenses WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({ message: 'Server error deleting expense' });
    }
});

module.exports = router;
