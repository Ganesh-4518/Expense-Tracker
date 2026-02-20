import { useState, useEffect } from 'react';
import { reminderAPI } from '../api/api';

const BILL_CATEGORIES = [
    { name: 'Bills', emoji: '📄' },
    { name: 'Rent', emoji: '🏠' },
    { name: 'Insurance', emoji: '🛡️' },
    { name: 'Subscriptions', emoji: '📺' },
    { name: 'Loan', emoji: '🏦' },
    { name: 'Utilities', emoji: '💡' },
    { name: 'Internet', emoji: '🌐' },
    { name: 'Phone', emoji: '📱' },
    { name: 'Other', emoji: '💸' }
];

const getCategoryEmoji = (name) => {
    const cat = BILL_CATEGORIES.find(c => c.name === name);
    return cat ? cat.emoji : '💸';
};

const Reminders = () => {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingReminder, setEditingReminder] = useState(null);
    const [filter, setFilter] = useState('all');
    const [formData, setFormData] = useState({
        title: '', amount: '', category: 'Bills', due_date: '',
        is_recurring: false, recurring_interval: 'monthly', reminder_days: 3, notes: ''
    });

    useEffect(() => {
        fetchReminders();
    }, []);

    const fetchReminders = async () => {
        try {
            setLoading(true);
            const response = await reminderAPI.getAll();
            setReminders(response.data);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingReminder) {
                await reminderAPI.update(editingReminder.id, formData);
            } else {
                await reminderAPI.create(formData);
            }
            setShowModal(false);
            setEditingReminder(null);
            resetForm();
            fetchReminders();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving reminder');
        }
    };

    const resetForm = () => {
        setFormData({
            title: '', amount: '', category: 'Bills', due_date: '',
            is_recurring: false, recurring_interval: 'monthly', reminder_days: 3, notes: ''
        });
    };

    const handleEdit = (reminder) => {
        setEditingReminder(reminder);
        setFormData({
            title: reminder.title,
            amount: reminder.amount,
            category: reminder.category,
            due_date: reminder.due_date?.split('T')[0] || '',
            is_recurring: reminder.is_recurring,
            recurring_interval: reminder.recurring_interval || 'monthly',
            reminder_days: reminder.reminder_days || 3,
            notes: reminder.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this reminder?')) return;
        try {
            await reminderAPI.delete(id);
            fetchReminders();
        } catch (error) {
            alert('Error deleting reminder');
        }
    };

    const handleMarkPaid = async (id) => {
        try {
            await reminderAPI.markPaid(id);
            fetchReminders();
        } catch (error) {
            alert('Error marking as paid');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusConfig = (status) => {
        switch (status) {
            case 'overdue': return { label: 'Overdue', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' };
            case 'due_today': return { label: 'Due Today', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' };
            case 'paid': return { label: 'Paid', color: '#10b981', bg: 'rgba(16,185,129,0.15)' };
            default: return { label: 'Upcoming', color: '#6366f1', bg: 'rgba(99,102,241,0.15)' };
        }
    };

    const filteredReminders = filter === 'all'
        ? reminders
        : reminders.filter(r => r.status === filter);

    const overdueCount = reminders.filter(r => r.status === 'overdue').length;
    const dueTodayCount = reminders.filter(r => r.status === 'due_today').length;

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
                    <h1 className="dashboard-title">Bill Reminders 🔔</h1>
                    <p className="dashboard-subtitle">
                        Never miss a payment
                        {overdueCount > 0 && <span style={{ color: '#ef4444', marginLeft: '0.5rem' }}>• {overdueCount} overdue</span>}
                        {dueTodayCount > 0 && <span style={{ color: '#f59e0b', marginLeft: '0.5rem' }}>• {dueTodayCount} due today</span>}
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingReminder(null); resetForm(); setShowModal(true); }}>
                    + New Reminder
                </button>
            </div>

            {/* Filter Tabs */}
            <div className="reminder-filters">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'overdue', label: '🔴 Overdue' },
                    { key: 'due_today', label: '🟠 Due Today' },
                    { key: 'upcoming', label: '🟢 Upcoming' },
                    { key: 'paid', label: '✅ Paid' }
                ].map(f => (
                    <button
                        key={f.key}
                        className={`reminder-filter-btn ${filter === f.key ? 'active' : ''}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                        {f.key !== 'all' && (
                            <span className="filter-count">
                                {reminders.filter(r => r.status === f.key).length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {filteredReminders.length > 0 ? (
                <div className="reminders-grid">
                    {filteredReminders.map(reminder => {
                        const statusConfig = getStatusConfig(reminder.status);
                        return (
                            <div key={reminder.id} className={`glass-card reminder-card ${reminder.status}`}>
                                <div className="reminder-header">
                                    <span className="reminder-category-badge">{getCategoryEmoji(reminder.category)} {reminder.category}</span>
                                    <span className="reminder-status-pill" style={{ background: statusConfig.bg, color: statusConfig.color }}>
                                        {statusConfig.label}
                                    </span>
                                </div>
                                <div className="reminder-body">
                                    <h3>{reminder.title}</h3>
                                    <div className="reminder-amount">{formatCurrency(reminder.amount)}</div>
                                    <div className="reminder-date">
                                        📅 Due: {new Date(reminder.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        {reminder.days_until_due !== undefined && reminder.status !== 'paid' && (
                                            <span style={{ marginLeft: '0.5rem', opacity: 0.7 }}>
                                                ({reminder.days_until_due === 0 ? 'Today' : reminder.days_until_due > 0 ? `in ${reminder.days_until_due}d` : `${Math.abs(reminder.days_until_due)}d ago`})
                                            </span>
                                        )}
                                    </div>
                                    {reminder.is_recurring && (
                                        <span className="reminder-recurring">↻ {reminder.recurring_interval}</span>
                                    )}
                                    {reminder.notes && (
                                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{reminder.notes}</div>
                                    )}
                                </div>
                                <div className="reminder-actions">
                                    {reminder.status !== 'paid' && (
                                        <button className="btn btn-success btn-sm" onClick={() => handleMarkPaid(reminder.id)}>
                                            ✓ Mark Paid
                                        </button>
                                    )}
                                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.25rem' }}>
                                        <button className="btn-icon" onClick={() => handleEdit(reminder)} title="Edit">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button className="btn-icon delete" onClick={() => handleDelete(reminder.id)} title="Delete">
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
                    <div className="empty-state-icon">🔔</div>
                    <h3>{filter === 'all' ? 'No reminders yet' : `No ${filter.replace('_', ' ')} reminders`}</h3>
                    <p>Add bill reminders to stay on top of your payments</p>
                    {filter === 'all' && (
                        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                            Add Your First Reminder
                        </button>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingReminder ? 'Edit Reminder' : 'New Bill Reminder'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Bill Name</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="e.g. Netflix, Electricity"
                                    required
                                    className="form-input"
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                        placeholder="e.g. 650"
                                        required
                                        min="1"
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="form-input"
                                    >
                                        {BILL_CATEGORIES.map(cat => (
                                            <option key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div className="form-group">
                                    <label>Due Date</label>
                                    <input
                                        type="date"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                        required
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Remind Before (days)</label>
                                    <input
                                        type="number"
                                        value={formData.reminder_days}
                                        onChange={e => setFormData({ ...formData, reminder_days: parseInt(e.target.value) })}
                                        min="1"
                                        max="30"
                                        className="form-input"
                                    />
                                </div>
                            </div>
                            <div className="checkbox-group">
                                <input
                                    type="checkbox"
                                    id="is_recurring"
                                    checked={formData.is_recurring}
                                    onChange={e => setFormData({ ...formData, is_recurring: e.target.checked })}
                                />
                                <label htmlFor="is_recurring">Recurring bill</label>
                            </div>
                            {formData.is_recurring && (
                                <div className="form-group">
                                    <label>Repeat Every</label>
                                    <select
                                        value={formData.recurring_interval}
                                        onChange={e => setFormData({ ...formData, recurring_interval: e.target.value })}
                                        className="form-input"
                                    >
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </div>
                            )}
                            <div className="form-group">
                                <label>Notes (optional)</label>
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="e.g. Account: Netflix Family Plan"
                                    className="form-input"
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">{editingReminder ? 'Update' : 'Create Reminder'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reminders;
