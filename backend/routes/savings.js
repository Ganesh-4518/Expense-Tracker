const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// @route   GET /api/savings
// @desc    Get all savings goals
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM savings_goals WHERE user_id = $1 ORDER BY created_at DESC',
            [req.user.id]
        );

        const goals = result.rows.map(goal => ({
            ...goal,
            percentage: parseFloat(goal.target_amount) > 0
                ? Math.round((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100)
                : 0,
            remaining: parseFloat(goal.target_amount) - parseFloat(goal.current_amount)
        }));

        res.json(goals);
    } catch (error) {
        console.error('Get savings error:', error);
        res.status(500).json({ message: 'Server error fetching savings goals' });
    }
});

// @route   POST /api/savings
// @desc    Create a savings goal
router.post('/', async (req, res) => {
    try {
        const { title, target_amount, deadline, icon } = req.body;

        if (!title || !target_amount) {
            return res.status(400).json({ message: 'Please provide title and target amount' });
        }

        const result = await pool.query(
            'INSERT INTO savings_goals (user_id, title, target_amount, deadline, icon) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, title, target_amount, deadline || null, icon || '💰']
        );

        const goal = result.rows[0];
        goal.percentage = 0;
        goal.remaining = parseFloat(goal.target_amount);

        res.status(201).json(goal);
    } catch (error) {
        console.error('Create savings goal error:', error);
        res.status(500).json({ message: 'Server error creating savings goal' });
    }
});

// @route   PUT /api/savings/:id
// @desc    Update a savings goal
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, target_amount, deadline, icon } = req.body;

        const check = await pool.query('SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Savings goal not found' });
        }

        const existing = check.rows[0];
        const result = await pool.query(
            'UPDATE savings_goals SET title = $1, target_amount = $2, deadline = $3, icon = $4 WHERE id = $5 AND user_id = $6 RETURNING *',
            [
                title || existing.title,
                target_amount || existing.target_amount,
                deadline !== undefined ? deadline : existing.deadline,
                icon || existing.icon,
                id,
                req.user.id
            ]
        );

        const goal = result.rows[0];
        goal.percentage = parseFloat(goal.target_amount) > 0
            ? Math.round((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100)
            : 0;
        goal.remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);

        res.json(goal);
    } catch (error) {
        console.error('Update savings goal error:', error);
        res.status(500).json({ message: 'Server error updating savings goal' });
    }
});

// @route   DELETE /api/savings/:id
// @desc    Delete a savings goal and its contributions
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const check = await pool.query('SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Savings goal not found' });
        }

        await pool.query('DELETE FROM savings_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ message: 'Savings goal deleted successfully' });
    } catch (error) {
        console.error('Delete savings goal error:', error);
        res.status(500).json({ message: 'Server error deleting savings goal' });
    }
});

// @route   POST /api/savings/:id/contribute
// @desc    Add a contribution to a savings goal
router.post('/:id/contribute', async (req, res) => {
    try {
        const { id } = req.params;
        const { amount, note, date } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: 'Please provide a valid amount' });
        }

        // Verify goal belongs to user
        const check = await pool.query('SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Savings goal not found' });
        }

        // Add contribution
        const contribution = await pool.query(
            'INSERT INTO savings_contributions (goal_id, amount, note, date) VALUES ($1, $2, $3, $4) RETURNING *',
            [id, amount, note || '', date || new Date().toISOString().split('T')[0]]
        );

        // Update goal's current_amount
        await pool.query(
            'UPDATE savings_goals SET current_amount = current_amount + $1 WHERE id = $2',
            [amount, id]
        );

        // Return updated goal
        const updatedGoal = await pool.query('SELECT * FROM savings_goals WHERE id = $1', [id]);
        const goal = updatedGoal.rows[0];
        goal.percentage = parseFloat(goal.target_amount) > 0
            ? Math.round((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100)
            : 0;
        goal.remaining = parseFloat(goal.target_amount) - parseFloat(goal.current_amount);

        res.status(201).json({ contribution: contribution.rows[0], goal });
    } catch (error) {
        console.error('Add contribution error:', error);
        res.status(500).json({ message: 'Server error adding contribution' });
    }
});

// @route   GET /api/savings/:id/contributions
// @desc    Get contribution history for a goal
router.get('/:id/contributions', async (req, res) => {
    try {
        const { id } = req.params;

        // Verify goal belongs to user
        const check = await pool.query('SELECT * FROM savings_goals WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Savings goal not found' });
        }

        const result = await pool.query(
            'SELECT * FROM savings_contributions WHERE goal_id = $1 ORDER BY date DESC',
            [id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Get contributions error:', error);
        res.status(500).json({ message: 'Server error fetching contributions' });
    }
});

module.exports = router;
