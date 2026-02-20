import { useState, useEffect } from 'react';
import { savingsAPI } from '../api/api';

const SavingsOverview = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGoals = async () => {
            try {
                const response = await savingsAPI.getAll();
                setGoals(response.data.slice(0, 3)); // Show top 3
            } catch (error) {
                console.error('Error fetching savings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGoals();
    }, []);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency', currency: 'INR',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(amount);
    };

    // Mini circular progress
    const MiniProgress = ({ percentage }) => {
        const size = 44;
        const strokeWidth = 4;
        const radius = (size - strokeWidth) / 2;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (Math.min(percentage, 100) / 100) * circumference;
        const color = percentage >= 100 ? '#10b981' : '#8b5cf6';

        return (
            <svg width={size} height={size}>
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
                <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
                    strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central"
                    fill="var(--text-primary)" fontSize="0.6rem" fontWeight="700">
                    {Math.min(percentage, 100)}%
                </text>
            </svg>
        );
    };

    if (loading) return null;
    if (goals.length === 0) return null;

    return (
        <div className="glass-card widget-savings">
            <div className="widget-header">
                <h3>🎯 Savings Goals</h3>
                <a href="/savings" className="widget-link">View All →</a>
            </div>
            <div className="widget-savings-list">
                {goals.map(g => (
                    <div key={g.id} className="widget-savings-item">
                        <span className="widget-savings-icon">{g.icon || '💰'}</span>
                        <div className="widget-savings-info">
                            <span className="widget-savings-title">{g.title}</span>
                            <span className="widget-savings-amounts">
                                {formatCurrency(g.current_amount)} / {formatCurrency(g.target_amount)}
                            </span>
                        </div>
                        <MiniProgress percentage={g.percentage} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SavingsOverview;
