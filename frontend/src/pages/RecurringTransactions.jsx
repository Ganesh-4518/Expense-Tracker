import { useState, useEffect } from 'react';
import { recurringAPI } from '../api/api';

const RecurringTransactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Salary',
        type: 'income',
        frequency: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        description: ''
    });

    const incomeCategories = [
        { name: 'Salary', emoji: '💰' },
        { name: 'Freelance', emoji: '💻' },
        { name: 'Investment', emoji: '📈' },
        { name: 'Business', emoji: '🏢' },
        { name: 'Rental', emoji: '🏠' },
        { name: 'Other', emoji: '💵' }
    ];

    const expenseCategories = [
        { name: 'Food', emoji: '🍔' },
        { name: 'Transport', emoji: '🚗' },
        { name: 'Shopping', emoji: '🛍️' },
        { name: 'Entertainment', emoji: '🎬' },
        { name: 'Bills', emoji: '📄' },
        { name: 'Healthcare', emoji: '🏥' },
        { name: 'Education', emoji: '📚' },
        { name: 'Other', emoji: '💳' }
    ];

    const frequencyLabels = {
        daily: '📅 Daily',
        weekly: '📆 Weekly',
        monthly: '🗓️ Monthly',
        yearly: '📊 Yearly'
    };

    const getCategories = () => formData.type === 'income' ? incomeCategories : expenseCategories;

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const response = await recurringAPI.getAll();
            setTransactions(response.data);
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await recurringAPI.create(formData);
            fetchTransactions();
            closeModal();
        } catch (error) {
            console.error('Error creating recurring transaction:', error);
        }
    };

    const handleToggle = async (id) => {
        try {
            await recurringAPI.toggle(id);
            fetchTransactions();
        } catch (error) {
            console.error('Error toggling recurring transaction:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
            try {
                await recurringAPI.delete(id);
                fetchTransactions();
            } catch (error) {
                console.error('Error deleting recurring transaction:', error);
            }
        }
    };

    const openModal = () => {
        setFormData({
            title: '',
            amount: '',
            category: 'Salary',
            type: 'income',
            frequency: 'monthly',
            start_date: new Date().toISOString().split('T')[0],
            description: ''
        });
        setShowModal(true);
    };

    const closeModal = () => setShowModal(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getCategoryEmoji = (categoryName, type) => {
        const cats = type === 'income' ? incomeCategories : expenseCategories;
        const cat = cats.find(c => c.name === categoryName);
        return cat ? cat.emoji : '💰';
    };

    const activeCount = transactions.filter(t => t.is_active).length;
    const pausedCount = transactions.filter(t => !t.is_active).length;

    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">🔄 Recurring Transactions</h1>
                    <p className="dashboard-subtitle">
                        {activeCount} active • {pausedCount} paused
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openModal}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Recurring
                </button>
            </div>

            {transactions.length > 0 ? (
                <div className="transactions-grid">
                    {transactions.map((item) => (
                        <div key={item.id} className={`transaction-card recurring-card ${item.type} ${!item.is_active ? 'paused' : ''}`}>
                            <div className="transaction-card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <h3 className="transaction-card-title">{item.title}</h3>
                                    <span className={`recurring-badge ${item.is_active ? 'active' : 'paused'}`}>
                                        {item.is_active ? '● Active' : '○ Paused'}
                                    </span>
                                </div>
                                <span className={`transaction-card-amount ${item.type}`}>
                                    {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                </span>
                            </div>
                            <div className="transaction-card-meta">
                                <span>{getCategoryEmoji(item.category, item.type)} {item.category}</span>
                                <span>{frequencyLabels[item.frequency]}</span>
                                <span className={`type-badge ${item.type}`}>
                                    {item.type === 'income' ? '↑ Income' : '↓ Expense'}
                                </span>
                            </div>
                            <div className="transaction-card-meta" style={{ marginTop: '0.25rem' }}>
                                <span>📅 Next: {formatDate(item.next_run_date)}</span>
                                <span>🗓️ Started: {formatDate(item.start_date)}</span>
                            </div>
                            {item.description && (
                                <p className="transaction-card-description">{item.description}</p>
                            )}
                            <div className="transaction-card-actions">
                                <button
                                    className={`btn btn-sm ${item.is_active ? 'btn-secondary' : 'btn-income'}`}
                                    onClick={() => handleToggle(item.id)}
                                >
                                    {item.is_active ? '⏸ Pause' : '▶ Resume'}
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(item.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🔄</div>
                    <h3>No recurring transactions</h3>
                    <p>Set up automatic income or expense entries that repeat on a schedule</p>
                    <button className="btn btn-primary" onClick={openModal}>
                        Add Your First Recurring Transaction
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add Recurring Transaction</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Type</label>
                                    <div className="type-toggle">
                                        <button
                                            type="button"
                                            className={`type-toggle-btn ${formData.type === 'income' ? 'active income' : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'income', category: 'Salary' })}
                                        >
                                            ↑ Income
                                        </button>
                                        <button
                                            type="button"
                                            className={`type-toggle-btn ${formData.type === 'expense' ? 'active expense' : ''}`}
                                            onClick={() => setFormData({ ...formData, type: 'expense', category: 'Food' })}
                                        >
                                            ↓ Expense
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Monthly Salary"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Amount (₹)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        placeholder="0"
                                        min="0"
                                        step="0.01"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {getCategories().map((cat) => (
                                            <option key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Frequency</label>
                                    <select
                                        className="form-input form-select"
                                        value={formData.frequency}
                                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                                    >
                                        <option value="daily">📅 Daily</option>
                                        <option value="weekly">📆 Weekly</option>
                                        <option value="monthly">🗓️ Monthly</option>
                                        <option value="yearly">📊 Yearly</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Start Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Description (Optional)</label>
                                    <textarea
                                        className="form-input"
                                        placeholder="Add a note..."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create Recurring
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecurringTransactions;
