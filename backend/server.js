const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDatabase } = require('./config/database');
const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expense');
const dashboardRoutes = require('./routes/dashboard');
const budgetRoutes = require('./routes/budgets');
const savingsRoutes = require('./routes/savings');
const reminderRoutes = require('./routes/reminders');
const { startReminderCron } = require('./cron/reminderCron');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/incomes', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/reminders', reminderRoutes);

// Health check route
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Finance Tracker API is running' });
});

// Initialize database and start server
const startServer = async () => {
    await initDatabase();
    // Start the bill reminder cron job
    startReminderCron();
    // Listen on 0.0.0.0 to allow connections from other devices on the network
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📱 Network access: http://192.168.1.125:${PORT}`);
        console.log(`📊 Finance Tracker API is ready!`);
    });
};

startServer();
