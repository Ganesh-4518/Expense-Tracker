const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/recurring
// @desc    Get all recurring transactions for user
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM recurring_transactions WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching recurring transactions:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/recurring
// @desc    Create a new recurring transaction
router.post('/', async (req, res) => {
    try {
        const { title, amount, category, type, frequency, start_date, description } = req.body;

        if (!title || !amount || !type || !frequency || !start_date) {
            return res.status(400).json({ message: 'Please provide all required fields' });
        }

        const result = await pool.query(
            `INSERT INTO recurring_transactions (user_id, title, amount, category, type, frequency, start_date, next_run_date, description)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $7, $8) RETURNING *`,
            [req.user.id, title, amount, category, type, frequency, start_date, description]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating recurring transaction:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/recurring/:id
// @desc    Update a recurring transaction
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, category, type, frequency, start_date, is_active, description } = req.body;

        const result = await pool.query(
            `UPDATE recurring_transactions 
             SET title = $1, amount = $2, category = $3, type = $4, frequency = $5, 
                 start_date = $6, is_active = $7, description = $8
             WHERE id = $9 AND user_id = $10 RETURNING *`,
            [title, amount, category, type, frequency, start_date, is_active, description, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Recurring transaction not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating recurring transaction:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PATCH /api/recurring/:id/toggle
// @desc    Toggle active state of recurring transaction
router.patch('/:id/toggle', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE recurring_transactions SET is_active = NOT is_active 
             WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Recurring transaction not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error toggling recurring transaction:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/recurring/:id
// @desc    Delete a recurring transaction
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Recurring transaction not found' });
        }
        res.json({ message: 'Recurring transaction deleted' });
    } catch (error) {
        console.error('Error deleting recurring transaction:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
