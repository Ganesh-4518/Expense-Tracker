import { useState, useEffect, useMemo } from 'react';
import { expenseAPI } from '../api/api';

const Expense = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Food',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortBy, setSortBy] = useState('date-desc');

    const categories = [
        { name: 'Food', emoji: '🍔' },
        { name: 'Transport', emoji: '🚗' },
        { name: 'Shopping', emoji: '🛍️' },
        { name: 'Entertainment', emoji: '🎬' },
        { name: 'Bills', emoji: '📄' },
        { name: 'Healthcare', emoji: '🏥' },
        { name: 'Education', emoji: '📚' },
        { name: 'Other', emoji: '💳' }
    ];

    const getCategoryEmoji = (categoryName) => {
        const cat = categories.find(c => c.name === categoryName);
        return cat ? cat.emoji : '💳';
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const response = await expenseAPI.getAll();
            setExpenses(response.data);
        } catch (error) {
            console.error('Error fetching expenses:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered and sorted expenses
    const filteredExpenses = useMemo(() => {
        let result = [...expenses];

        // Apply search filter
        if (searchTerm) {
            result = result.filter(expense =>
                expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                expense.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (categoryFilter !== 'All') {
            result = result.filter(expense => expense.category === categoryFilter);
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return parseFloat(b.amount) - parseFloat(a.amount);
                case 'amount-asc':
                    return parseFloat(a.amount) - parseFloat(b.amount);
                case 'title-asc':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

        return result;
    }, [expenses, searchTerm, categoryFilter, sortBy]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await expenseAPI.create(formData);
            fetchExpenses();
            closeModal();
        } catch (error) {
            console.error('Error saving expense:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this expense?')) {
            try {
                await expenseAPI.delete(id);
                fetchExpenses();
            } catch (error) {
                console.error('Error deleting expense:', error);
            }
        }
    };

    const openModal = () => {
        setFormData({
            title: '',
            amount: '',
            category: 'Food',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setCategoryFilter('All');
        setSortBy('date-desc');
    };

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

    const totalExpense = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const filteredTotal = filteredExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

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
                    <h1 className="page-title">💸 Expenses</h1>
                    <p className="dashboard-subtitle">Total: <span className="text-expense">{formatCurrency(totalExpense)}</span></p>
                </div>
                <button className="btn btn-expense" onClick={openModal}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Expense
                </button>
            </div>

            {/* Search and Filter */}
            <div className="search-filter-container">
                <div className="search-box">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search expenses..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="All">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</option>
                        ))}
                    </select>
                    <select
                        className="filter-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="date-desc">Newest First</option>
                        <option value="date-asc">Oldest First</option>
                        <option value="amount-desc">Highest Amount</option>
                        <option value="amount-asc">Lowest Amount</option>
                        <option value="title-asc">A-Z</option>
                    </select>
                    {(searchTerm || categoryFilter !== 'All') && (
                        <button className="clear-filters" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {/* Results count */}
            {(searchTerm || categoryFilter !== 'All') && (
                <p className="results-count">
                    Showing {filteredExpenses.length} of {expenses.length} entries
                    ({formatCurrency(filteredTotal)})
                </p>
            )}

            {filteredExpenses.length > 0 ? (
                <div className="transactions-grid">
                    {filteredExpenses.map((expense) => (
                        <div key={expense.id} className="transaction-card expense">
                            <div className="transaction-card-header">
                                <h3 className="transaction-card-title">{expense.title}</h3>
                                <span className="transaction-card-amount expense">
                                    -{formatCurrency(expense.amount)}
                                </span>
                            </div>
                            <div className="transaction-card-meta">
                                <span>{getCategoryEmoji(expense.category)} {expense.category}</span>
                                <span>📅 {formatDate(expense.date)}</span>
                            </div>
                            {expense.description && (
                                <p className="transaction-card-description">{expense.description}</p>
                            )}
                            <div className="transaction-card-actions">
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(expense.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : expenses.length > 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <h3>No results found</h3>
                    <p>Try adjusting your search or filters</p>
                    <button className="btn btn-secondary" onClick={clearFilters}>
                        Clear Filters
                    </button>
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🧾</div>
                    <h3>No expenses recorded</h3>
                    <p>Start tracking your spending by adding your first expense</p>
                    <button className="btn btn-expense" onClick={openModal}>
                        Add Your First Expense
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Expense</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="e.g., Groceries"
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
                                        {categories.map((cat) => (
                                            <option key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Date</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                                <button type="submit" className="btn btn-expense">
                                    Add Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expense;
