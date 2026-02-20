import { useState, useEffect } from 'react';
import { budgetAPI } from '../api/api';

const BudgetOverview = () => {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBudgets = async () => {
            try {
                const month = new Date().getMonth() + 1;
                const year = new Date().getFullYear();
                const response = await budgetAPI.getStatus(month, year);
                setBudgets(response.data.slice(0, 4)); // Show top 4
            } catch (error) {
                console.error('Error fetching budgets:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBudgets();
    }, []);

    const getProgressColor = (pct) => {
        if (pct >= 90) return '#ef4444';
        if (pct >= 75) return '#f59e0b';
        return '#10b981';
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    };

    if (loading) return null;
    if (budgets.length === 0) return null;

    return (
        <div className="glass-card widget-budget">
            <div className="widget-header">
                <h3>📊 Budget Status</h3>
                <a href="/budgets" className="widget-link">View All →</a>
            </div>
            <div className="widget-budget-list">
                {budgets.map(b => (
                    <div key={b.id} className="widget-budget-item">
                        <div className="widget-budget-info">
                            <span className="widget-budget-category">{b.category}</span>
                            <span className="widget-budget-amounts">
                                {formatCurrency(b.spent || 0)} / {formatCurrency(b.amount)}
                            </span>
                        </div>
                        <div className="widget-progress-track">
                            <div
                                className="widget-progress-fill"
                                style={{
                                    width: `${Math.min(b.percentage, 100)}%`,
                                    background: getProgressColor(b.percentage)
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BudgetOverview;
