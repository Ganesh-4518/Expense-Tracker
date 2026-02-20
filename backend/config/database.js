const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finance_tracker',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Initialize database tables
const initDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create incomes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS incomes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create expenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(50),
        description TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create budget_goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS budget_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
        year INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, category, month, year)
      )
    `);

    // Create savings_goals table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS savings_goals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        target_amount DECIMAL(12, 2) NOT NULL,
        current_amount DECIMAL(12, 2) DEFAULT 0,
        deadline DATE,
        icon VARCHAR(10) DEFAULT '💰',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create savings_contributions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS savings_contributions (
        id SERIAL PRIMARY KEY,
        goal_id INTEGER REFERENCES savings_goals(id) ON DELETE CASCADE,
        amount DECIMAL(12, 2) NOT NULL,
        note TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create bill_reminders table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bill_reminders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        category VARCHAR(50),
        due_date DATE NOT NULL,
        is_recurring BOOLEAN DEFAULT false,
        recurring_interval VARCHAR(20),
        reminder_days INTEGER DEFAULT 3,
        is_paid BOOLEAN DEFAULT false,
        last_paid_date DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error.message);
  }
};

module.exports = { pool, initDatabase };
