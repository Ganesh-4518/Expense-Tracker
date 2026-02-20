import { useState, useEffect } from 'react';
import { budgetAPI } from '../api/api';

const EXPENSE_CATEGORIES = [
    { name: 'Food', emoji: '🍔' },
    { name: 'Transport', emoji: '🚗' },
    { name: 'Entertainment', emoji: '🎬' },
    { name: 'Shopping', emoji: '🛍️' },
    { name: 'Bills', emoji: '📄' },
    { name: 'Health', emoji: '💊' },
    { name: 'Education', emoji: '📚' },
    { name: 'Housing', emoji: '🏠' },
    { name: 'Travel', emoji: '✈️' },
    { name: 'Other', emoji: '💸' }
];

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [formData, setFormData] = useState({ category: '', amount: '' });

    useEffect(() => {
        fetchBudgets();
    }, [month, year]);

    const fetchBudgets = async () => {
        try {
            setLoading(true);
            const response = await budgetAPI.getStatus(month, year);
            setBudgets(response.data);
        } catch (error) {
            console.error('Error fetching budgets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingBudget) {
                await budgetAPI.update(editingBudget.id, formData);
            } else {
                await budgetAPI.create({ ...formData, month, year });
            }
            setShowModal(false);
            setEditingBudget(null);
            setFormData({ category: '', amount: '' });
            fetchBudgets();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving budget');
        }
    };

    const handleEdit = (budget) => {
        setEditingBudget(budget);
        setFormData({ category: budget.category, amount: budget.amount });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this budget goal?')) return;
        try {
            await budgetAPI.delete(id);
            fetchBudgets();
        } catch (error) {
            alert('Error deleting budget');
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 90) return '#ef4444';
        if (percentage >= 75) return '#f59e0b';
        return '#10b981';
    };

    const getStatusLabel = (percentage) => {
        if (percentage > 100) return 'Over Budget!';
        if (percentage >= 90) return 'Critical';
        if (percentage >= 75) return 'Warning';
        return 'On Track';
    };

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    };

    const totalBudget = budgets.reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
    const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

    // Categories already budgeted this month
    const budgetedCategories = budgets.map(b => b.category);

    const getCategoryEmoji = (name) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.name === name);
        return cat ? cat.emoji : '💸';
    };

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header">
                <div>
                    <h1 className="dashboard-title">Monthly Budgets 📊</h1>
                    <p className="dashboard-subtitle">Set spending limits and track your expenses</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value))}
                        className="filter-select"
                    >
                        {monthNames.map((m, i) => (
                            <option key={i} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value))}
                        className="filter-select"
                    >
                        {[2024, 2025, 2026, 2027].map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={() => { setEditingBudget(null); setFormData({ category: '', amount: '' }); setShowModal(true); }}>
                        + Set Budget
                    </button>
                </div>
            </div>

            {/* Overall Summary */}
            {budgets.length > 0 && (
                <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <div>
                            <h3 style={{ color: 'var(--text-primary)', margin: 0 }}>Overall Budget</h3>
                            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>
                                {monthNames[month - 1]} {year}
                            </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: getProgressColor(overallPercentage) }}>
                                {overallPercentage}%
                            </div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                            </div>
                        </div>
                    </div>
                    <div className="budget-progress-track">
                        <div
                            className="budget-progress-fill"
                            style={{
                                width: `${Math.min(overallPercentage, 100)}%`,
                                background: getProgressColor(overallPercentage)
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Budget Cards */}
            {budgets.length > 0 ? (
                <div className="budget-grid">
                    {budgets.map(budget => (
                        <div key={budget.id} className={`glass-card budget-card ${budget.percentage >= 90 ? 'budget-danger' : budget.percentage >= 75 ? 'budget-warning' : ''}`}>
                            <div className="budget-card-header">
                                <h3>{getCategoryEmoji(budget.category)} {budget.category}</h3>
                                <span className="budget-status-badge" style={{ background: `${getProgressColor(budget.percentage)}20`, color: getProgressColor(budget.percentage) }}>
                                    {getStatusLabel(budget.percentage)}
                                </span>
                            </div>
                            <div className="budget-amounts">
                                <span className="budget-spent">{formatCurrency(budget.spent || 0)}</span>
                                <span className="budget-limit">/ {formatCurrency(budget.amount)}</span>
                            </div>
                            <div className="budget-progress-track">
                                <div
                                    className="budget-progress-fill"
                                    style={{
                                        width: `${Math.min(budget.percentage, 100)}%`,
                                        background: getProgressColor(budget.percentage)
                                    }}
                                />
                            </div>
                            <div className="budget-card-footer">
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                                    {budget.percentage}% used • {formatCurrency(Math.max(parseFloat(budget.amount) - (budget.spent || 0), 0))} remaining
                                </span>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button className="btn-icon" onClick={() => handleEdit(budget)} title="Edit">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button className="btn-icon delete" onClick={() => handleDelete(budget.id)} title="Delete">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h3>No budgets set for {monthNames[month - 1]} {year}</h3>
                    <p>Set spending limits per category to track your expenses</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Set Your First Budget
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingBudget ? 'Edit Budget' : 'Set Budget Goal'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Category</label>
                                <select
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    required
                                    className="form-input"
                                    disabled={!!editingBudget}
                                >
                                    <option value="">Select category</option>
                                    {EXPENSE_CATEGORIES
                                        .filter(cat => editingBudget ? true : !budgetedCategories.includes(cat.name))
                                        .map(cat => (
                                            <option key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</option>
                                        ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Monthly Limit (₹)</label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="e.g. 5000"
                                    required
                                    min="1"
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingBudget ? 'Update' : 'Set Budget'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budgets;
