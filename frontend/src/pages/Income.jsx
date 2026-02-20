import { useState, useEffect, useMemo } from 'react';
import { incomeAPI } from '../api/api';

const Income = () => {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        amount: '',
        category: 'Salary',
        description: '',
        date: new Date().toISOString().split('T')[0]
    });

    // Search and Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [sortBy, setSortBy] = useState('date-desc');

    const categories = [
        { name: 'Salary', emoji: '💼' },
        { name: 'Freelance', emoji: '💻' },
        { name: 'Investment', emoji: '📈' },
        { name: 'Business', emoji: '🏢' },
        { name: 'Rental', emoji: '🏠' },
        { name: 'Other', emoji: '💰' }
    ];

    const getCategoryEmoji = (categoryName) => {
        const cat = categories.find(c => c.name === categoryName);
        return cat ? cat.emoji : '💰';
    };

    useEffect(() => {
        fetchIncomes();
    }, []);

    const fetchIncomes = async () => {
        try {
            const response = await incomeAPI.getAll();
            setIncomes(response.data);
        } catch (error) {
            console.error('Error fetching incomes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Filtered and sorted incomes
    const filteredIncomes = useMemo(() => {
        let result = [...incomes];

        // Apply search filter
        if (searchTerm) {
            result = result.filter(income =>
                income.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                income.description?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (categoryFilter !== 'All') {
            result = result.filter(income => income.category === categoryFilter);
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
    }, [incomes, searchTerm, categoryFilter, sortBy]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await incomeAPI.create(formData);
            fetchIncomes();
            closeModal();
        } catch (error) {
            console.error('Error saving income:', error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this income?')) {
            try {
                await incomeAPI.delete(id);
                fetchIncomes();
            } catch (error) {
                console.error('Error deleting income:', error);
            }
        }
    };

    const openModal = () => {
        setFormData({
            title: '',
            amount: '',
            category: 'Salary',
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

    const totalIncome = incomes.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const filteredTotal = filteredIncomes.reduce((sum, item) => sum + parseFloat(item.amount), 0);

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
                    <h1 className="page-title">💰 Income</h1>
                    <p className="dashboard-subtitle">Total: <span className="text-income">{formatCurrency(totalIncome)}</span></p>
                </div>
                <button className="btn btn-income" onClick={openModal}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Income
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
                        placeholder="Search income..."
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
                    Showing {filteredIncomes.length} of {incomes.length} entries
                    ({formatCurrency(filteredTotal)})
                </p>
            )}

            {filteredIncomes.length > 0 ? (
                <div className="transactions-grid">
                    {filteredIncomes.map((income) => (
                        <div key={income.id} className="transaction-card income">
                            <div className="transaction-card-header">
                                <h3 className="transaction-card-title">{income.title}</h3>
                                <span className="transaction-card-amount income">
                                    +{formatCurrency(income.amount)}
                                </span>
                            </div>
                            <div className="transaction-card-meta">
                                <span>{getCategoryEmoji(income.category)} {income.category}</span>
                                <span>📅 {formatDate(income.date)}</span>
                            </div>
                            {income.description && (
                                <p className="transaction-card-description">{income.description}</p>
                            )}
                            <div className="transaction-card-actions">
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(income.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : incomes.length > 0 ? (
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
                    <div className="empty-state-icon">💸</div>
                    <h3>No income recorded</h3>
                    <p>Start tracking your income by adding your first entry</p>
                    <button className="btn btn-income" onClick={openModal}>
                        Add Your First Income
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Add New Income</h2>
                            <button className="modal-close" onClick={closeModal}>&times;</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
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
                                <button type="submit" className="btn btn-income">
                                    Add Income
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Income;
