import { useState, useEffect } from 'react';
import { savingsAPI } from '../api/api';

const GOAL_ICONS = ['💰', '🏖️', '🚗', '🏠', '🎓', '💊', '🎮', '✈️', '👶', '🛡️', '💍', '📱'];

const Savings = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showContributeModal, setShowContributeModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);
    const [selectedGoal, setSelectedGoal] = useState(null);
    const [contributions, setContributions] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [formData, setFormData] = useState({ title: '', target_amount: '', deadline: '', icon: '💰' });
    const [contributeData, setContributeData] = useState({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        fetchGoals();
    }, []);

    const fetchGoals = async () => {
        try {
            setLoading(true);
            const response = await savingsAPI.getAll();
            setGoals(response.data);
        } catch (error) {
            console.error('Error fetching savings goals:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingGoal) {
                await savingsAPI.update(editingGoal.id, formData);
            } else {
                await savingsAPI.create(formData);
            }
            setShowModal(false);
            setEditingGoal(null);
            setFormData({ title: '', target_amount: '', deadline: '', icon: '💰' });
            fetchGoals();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving goal');
        }
    };

    const handleContribute = async (e) => {
        e.preventDefault();
        try {
            await savingsAPI.contribute(selectedGoal.id, contributeData);
            setShowContributeModal(false);
            setContributeData({ amount: '', note: '', date: new Date().toISOString().split('T')[0] });
            fetchGoals();
        } catch (error) {
            alert(error.response?.data?.message || 'Error adding contribution');
        }
    };

    const handleEdit = (goal) => {
        setEditingGoal(goal);
        setFormData({
            title: goal.title,
            target_amount: goal.target_amount,
            deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
            icon: goal.icon || '💰'
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this savings goal and all its contributions?')) return;
        try {
            await savingsAPI.delete(id);
            fetchGoals();
        } catch (error) {
            alert('Error deleting goal');
        }
    };

    const handleViewHistory = async (goal) => {
        setSelectedGoal(goal);
        try {
            const response = await savingsAPI.getContributions(goal.id);
            setContributions(response.data);
            setShowHistory(true);
        } catch (error) {
            console.error('Error fetching contributions:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    };

    const getDaysRemaining = (deadline) => {
        if (!deadline) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const target = new Date(deadline);
        target.setHours(0, 0, 0, 0);
        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
        return diff;
    };

    // SVG circular progress
    const CircularProgress = ({ percentage, size = 100, strokeWidth = 8 }) => {
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
        const color = percentage >= 100 ? '#10b981' : percentage >= 50 ? '#6366f1' : '#8b5cf6';

        return (
            <svg width={size} height={size} className="savings-progress-ring">
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                />
                <circle
                    cx={size / 2} cy={size / 2} r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                    fill="var(--text-primary)" fontSize="1.25rem" fontWeight="800">
                    {Math.min(percentage, 100)}%
                </text>
            </svg>
        );
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
                    <h1 className="dashboard-title">Savings Goals 🎯</h1>
                    <p className="dashboard-subtitle">Track your savings and reach your financial goals</p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingGoal(null); setFormData({ title: '', target_amount: '', deadline: '', icon: '💰' }); setShowModal(true); }}>
                    + New Goal
                </button>
            </div>

            {goals.length > 0 ? (
                <div className="savings-grid">
                    {goals.map(goal => {
                        const daysLeft = getDaysRemaining(goal.deadline);
                        return (
                            <div key={goal.id} className={`glass-card savings-card ${goal.percentage >= 100 ? 'savings-complete' : ''}`}>
                                <div className="savings-card-top">
                                    <div className="savings-info">
                                        <div className="savings-icon">{goal.icon || '💰'}</div>
                                        <div>
                                            <h3>{goal.title}</h3>
                                            {daysLeft !== null && (
                                                <span className={`savings-deadline ${daysLeft < 0 ? 'overdue' : daysLeft <= 30 ? 'soon' : ''}`}>
                                                    {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : daysLeft === 0 ? 'Today!' : `${daysLeft}d left`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <CircularProgress percentage={goal.percentage} />
                                </div>

                                <div className="savings-amounts">
                                    <div>
                                        <span className="savings-current">{formatCurrency(goal.current_amount)}</span>
                                        <span className="savings-target"> / {formatCurrency(goal.target_amount)}</span>
                                    </div>
                                    <span className="savings-remaining">
                                        {goal.remaining > 0 ? `${formatCurrency(goal.remaining)} to go` : '🎉 Goal reached!'}
                                    </span>
                                </div>

                                <div className="savings-actions">
                                    <button className="btn btn-primary btn-sm" onClick={() => { setSelectedGoal(goal); setShowContributeModal(true); }}>
                                        + Add Funds
                                    </button>
                                    <button className="btn btn-secondary btn-sm" onClick={() => handleViewHistory(goal)}>
                                        History
                                    </button>
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn-icon" onClick={() => handleEdit(goal)} title="Edit">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(goal.id)} title="Delete">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">🎯</div>
                    <h3>No savings goals yet</h3>
                    <p>Create your first savings goal and start tracking progress</p>
                    <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                        Create Your First Goal
                    </button>
                </div>
            )}

            {/* Create/Edit Goal Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingGoal ? 'Edit Goal' : 'New Savings Goal'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Icon</label>
                                <div className="icon-picker">
                                    {GOAL_ICONS.map(icon => (
                                        <button
                                            key={icon}
                                            type="button"
                                            className={`icon-option ${formData.icon === icon ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, icon })}
                                        >
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Goal Name</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Vacation Fund"
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Amount (₹)</label>
                                <input
                                    type="number"
                                    value={formData.target_amount}
                                    onChange={e => setFormData({ ...formData, target_amount: e.target.value })}
                                    placeholder="e.g. 50000"
                                    required
                                    min="1"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Target Date (optional)</label>
                                <input
                                    type="date"
                                    value={formData.deadline}
                                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingGoal ? 'Update' : 'Create Goal'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contribute Modal */}
            {showContributeModal && selectedGoal && (
                <div className="modal-overlay" onClick={() => setShowContributeModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add Funds to {selectedGoal.icon} {selectedGoal.title}</h2>
                            <button className="modal-close" onClick={() => setShowContributeModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleContribute}>
                            <div className="form-group">
                                <label>Amount (₹)</label>
                                <input
                                    type="number"
                                    value={contributeData.amount}
                                    onChange={e => setContributeData({ ...contributeData, amount: e.target.value })}
                                    placeholder="e.g. 1000"
                                    required
                                    min="1"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Note (optional)</label>
                                <input
                                    type="text"
                                    value={contributeData.note}
                                    onChange={e => setContributeData({ ...contributeData, note: e.target.value })}
                                    placeholder="e.g. Monthly deposit"
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={contributeData.date}
                                    onChange={e => setContributeData({ ...contributeData, date: e.target.value })}
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowContributeModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Add Funds</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Contribution History Modal */}
            {showHistory && selectedGoal && (
                <div className="modal-overlay" onClick={() => setShowHistory(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{selectedGoal.icon} {selectedGoal.title} - History</h2>
                            <button className="modal-close" onClick={() => setShowHistory(false)}>×</button>
                        </div>
                        {contributions.length > 0 ? (
                            <div className="contribution-list">
                                {contributions.map(c => (
                                    <div key={c.id} className="contribution-item">
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                +{formatCurrency(c.amount)}
                                            </div>
                                            {c.note && <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{c.note}</div>}
                                        </div>
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                                            {new Date(c.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No contributions yet</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Savings;
