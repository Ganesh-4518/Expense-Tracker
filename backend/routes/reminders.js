const express = require('express');
const { pool } = require('../config/database');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// @route   GET /api/reminders/upcoming
// @desc    Get upcoming unpaid bills (must be before /)
router.get('/upcoming', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM bill_reminders
             WHERE user_id = $1 AND is_paid = false
             ORDER BY due_date ASC
             LIMIT 5`,
            [req.user.id]
        );

        const reminders = result.rows.map(r => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(r.due_date);
            dueDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            let status = 'upcoming';
            if (diffDays < 0) status = 'overdue';
            else if (diffDays === 0) status = 'due_today';

            return { ...r, status, days_until_due: diffDays };
        });

        res.json(reminders);
    } catch (error) {
        console.error('Get upcoming reminders error:', error);
        res.status(500).json({ message: 'Server error fetching upcoming reminders' });
    }
});

// @route   GET /api/reminders
// @desc    Get all reminders
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM bill_reminders WHERE user_id = $1 ORDER BY due_date ASC',
            [req.user.id]
        );

        const reminders = result.rows.map(r => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dueDate = new Date(r.due_date);
            dueDate.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));

            let status = 'upcoming';
            if (r.is_paid) status = 'paid';
            else if (diffDays < 0) status = 'overdue';
            else if (diffDays === 0) status = 'due_today';

            return { ...r, status, days_until_due: diffDays };
        });

        res.json(reminders);
    } catch (error) {
        console.error('Get reminders error:', error);
        res.status(500).json({ message: 'Server error fetching reminders' });
    }
});

// @route   POST /api/reminders
// @desc    Create a new reminder
router.post('/', async (req, res) => {
    try {
        const { title, amount, category, due_date, is_recurring, recurring_interval, reminder_days, notes } = req.body;

        if (!title || !amount || !due_date) {
            return res.status(400).json({ message: 'Please provide title, amount, and due date' });
        }

        const result = await pool.query(
            `INSERT INTO bill_reminders (user_id, title, amount, category, due_date, is_recurring, recurring_interval, reminder_days, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [req.user.id, title, amount, category || 'Other', due_date, is_recurring || false, recurring_interval || null, reminder_days || 3, notes || '']
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Create reminder error:', error);
        res.status(500).json({ message: 'Server error creating reminder' });
    }
});

// @route   PUT /api/reminders/:id
// @desc    Update a reminder
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, amount, category, due_date, is_recurring, recurring_interval, reminder_days, notes } = req.body;

        const check = await pool.query('SELECT * FROM bill_reminders WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        const existing = check.rows[0];
        const result = await pool.query(
            `UPDATE bill_reminders SET title = $1, amount = $2, category = $3, due_date = $4,
             is_recurring = $5, recurring_interval = $6, reminder_days = $7, notes = $8
             WHERE id = $9 AND user_id = $10 RETURNING *`,
            [
                title || existing.title,
                amount || existing.amount,
                category || existing.category,
                due_date || existing.due_date,
                is_recurring !== undefined ? is_recurring : existing.is_recurring,
                recurring_interval || existing.recurring_interval,
                reminder_days || existing.reminder_days,
                notes !== undefined ? notes : existing.notes,
                id,
                req.user.id
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Update reminder error:', error);
        res.status(500).json({ message: 'Server error updating reminder' });
    }
});

// @route   DELETE /api/reminders/:id
// @desc    Delete a reminder
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const check = await pool.query('SELECT * FROM bill_reminders WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        await pool.query('DELETE FROM bill_reminders WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        console.error('Delete reminder error:', error);
        res.status(500).json({ message: 'Server error deleting reminder' });
    }
});

// @route   POST /api/reminders/:id/mark-paid
// @desc    Mark a bill as paid, advance due date if recurring
router.post('/:id/mark-paid', async (req, res) => {
    try {
        const { id } = req.params;

        const check = await pool.query('SELECT * FROM bill_reminders WHERE id = $1 AND user_id = $2', [id, req.user.id]);
        if (check.rows.length === 0) {
            return res.status(404).json({ message: 'Reminder not found' });
        }

        const reminder = check.rows[0];

        // Create an expense entry for this paid bill
        await pool.query(
            'INSERT INTO expenses (user_id, title, amount, category, description, date) VALUES ($1, $2, $3, $4, $5, $6)',
            [req.user.id, reminder.title, reminder.amount, reminder.category || 'Bills', `Bill payment: ${reminder.title}`, new Date().toISOString().split('T')[0]]
        );

        if (reminder.is_recurring && reminder.recurring_interval) {
            // Calculate next due date
            const currentDue = new Date(reminder.due_date);
            let nextDue = new Date(currentDue);

            switch (reminder.recurring_interval) {
                case 'weekly':
                    nextDue.setDate(nextDue.getDate() + 7);
                    break;
                case 'monthly':
                    nextDue.setMonth(nextDue.getMonth() + 1);
                    break;
                case 'yearly':
                    nextDue.setFullYear(nextDue.getFullYear() + 1);
                    break;
            }

            await pool.query(
                'UPDATE bill_reminders SET is_paid = false, due_date = $1, last_paid_date = $2 WHERE id = $3',
                [nextDue.toISOString().split('T')[0], new Date().toISOString().split('T')[0], id]
            );

            const updated = await pool.query('SELECT * FROM bill_reminders WHERE id = $1', [id]);
            res.json({ message: 'Bill marked as paid. Next due date set.', reminder: updated.rows[0] });
        } else {
            await pool.query(
                'UPDATE bill_reminders SET is_paid = true, last_paid_date = $1 WHERE id = $2',
                [new Date().toISOString().split('T')[0], id]
            );

            const updated = await pool.query('SELECT * FROM bill_reminders WHERE id = $1', [id]);
            res.json({ message: 'Bill marked as paid.', reminder: updated.rows[0] });
        }
    } catch (error) {
        console.error('Mark paid error:', error);
        res.status(500).json({ message: 'Server error marking bill as paid' });
    }
});

module.exports = router;
