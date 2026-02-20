const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(auth);

// @route   GET /api/incomes
// @desc    Get all incomes for logged in user
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM incomes WHERE user_id = $1 ORDER BY date DESC',
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Get incomes error:', error);
        res.status(500).json({ message: 'Server error fetching incomes' });
    }
});

// @route   POST /api/incomes
// @desc    Add new income
router.post('/', async (req, res) => {
    try {
        const { title, amount, category, description, date } = req.body;

        if (!title || !amount || !date) {
            return res.status(400).json({ message: 'Please provide title, amount, and date' });
        }

        const result = await pool.query(
            'INSERT INTO incomes (user_id, title, amount, category, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.user.id, title, amount, category || 'Other', description || '', date]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Add income error:', error);
        res.status(500).json({ message: 'Server error adding income' });
    }
});

// @route   PUT /api/incomes/:id
// @desc    Update income
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, category, description, date } = req.body;

        // Check if income belongs to user
        const check = await pool.query('SELECT * FROM incomes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Income not found' });
        }

        const result = await pool.query(
            'UPDATE incomes SET title = $1, amount = $2, category = $3, description = $4, date = $5 WHERE id = $6 AND user_id = $7 RETURNING *',
            [title, amount, category, description, date, id, req.user.id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update income error:', error);
        res.status(500).json({ message: 'Server error updating income' });
    }
});

// @route   DELETE /api/incomes/:id
// @desc    Delete income
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Check if income belongs to user
        const check = await pool.query('SELECT * FROM incomes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Income not found' });
        }

        await pool.query('DELETE FROM incomes WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ message: 'Income deleted successfully' });
    } catch (error) {
        console.error('Delete income error:', error);
        res.status(500).json({ message: 'Server error deleting income' });
    }
});

module.exports = router;
