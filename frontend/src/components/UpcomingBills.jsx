import { useState, useEffect } from 'react';
import { reminderAPI } from '../api/api';

const UpcomingBills = () => {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBills = async () => {
            try {
                const response = await reminderAPI.getUpcoming();
                setBills(response.data.slice(0, 3)); // Show top 3
            } catch (error) {
                console.error('Error fetching upcoming bills:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    };

    const getStatusDot = (status) => {
        switch (status) {
            case 'overdue': return { color: '#ef4444', label: 'Overdue' };
            case 'due_today': return { color: '#f59e0b', label: 'Due Today' };
            default: return { color: '#10b981', label: 'Upcoming' };
        }
    };

    if (loading) return null;
    if (bills.length === 0) return null;

    return (
        <div className="glass-card widget-bills">
            <div className="widget-header">
                <h3>🔔 Upcoming Bills</h3>
                <a href="/reminders" className="widget-link">View All →</a>
            </div>
            <div className="widget-bills-list">
                {bills.map(bill => {
                    const statusDot = getStatusDot(bill.status);
                    return (
                        <div key={bill.id} className="widget-bill-item">
                            <div className="widget-bill-dot" style={{ background: statusDot.color }} />
                            <div className="widget-bill-info">
                                <span className="widget-bill-title">{bill.title}</span>
                                <span className="widget-bill-date">
                                    {new Date(bill.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    {bill.days_until_due === 0 ? ' • Today' : bill.days_until_due > 0 ? ` • in ${bill.days_until_due}d` : ` • ${Math.abs(bill.days_until_due)}d ago`}
                                </span>
                            </div>
                            <div className="widget-bill-amount">{formatCurrency(bill.amount)}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default UpcomingBills;
