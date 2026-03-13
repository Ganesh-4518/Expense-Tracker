import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend, PieChart, Pie, Cell } from 'recharts';
import { analyticsAPI } from '../api/api';

const Analytics = () => {
    const [loading, setLoading] = useState(true);
    const [monthlySummary, setMonthlySummary] = useState([]);
    const [topCategories, setTopCategories] = useState([]);
    const [stats, setStats] = useState(null);
    const [period, setPeriod] = useState('6');

    const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f472b6', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];

    useEffect(() => {
        fetchAnalyticsData();
    }, [period]);

    const fetchAnalyticsData = async () => {
        try {
            setLoading(true);
            const [summaryRes, categoriesRes, statsRes] = await Promise.all([
                analyticsAPI.getMonthlySummary(),
                analyticsAPI.getTopCategories(period),
                analyticsAPI.getStats()
            ]);
            setMonthlySummary(summaryRes.data);
            setTopCategories(categoriesRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatCompact = (amount) => {
        if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
        if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`;
        return `₹${amount}`;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    boxShadow: 'var(--shadow-md)'
                }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '0.25rem' }}>{label}</p>
                    {payload.map((item, idx) => (
                        <p key={idx} style={{ color: item.color, fontSize: '0.875rem' }}>
                            {item.name}: {formatCurrency(item.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    // Compute net savings per month for area chart
    const savingsData = monthlySummary.map(m => ({
        ...m,
        savings: m.income - m.expense
    }));

    // Get max category total for bar width scaling
    const maxCategoryTotal = topCategories.length > 0
        ? Math.max(...topCategories.map(c => parseFloat(c.total)))
        : 1;

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
                    <h1 className="page-title">📊 Analytics & Reports</h1>
                    <p className="dashboard-subtitle">Deep insights into your finances</p>
                </div>
                <div className="filter-group">
                    <select
                        className="filter-select"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="3">Last 3 months</option>
                        <option value="6">Last 6 months</option>
                        <option value="12">Last 12 months</option>
                    </select>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="analytics-stats-grid">
                    <div className="analytics-stat-card">
                        <div className="analytics-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>📈</div>
                        <div>
                            <p className="analytics-stat-label">Avg Monthly Income</p>
                            <p className="analytics-stat-value">{formatCurrency(stats.avgMonthlyIncome)}</p>
                        </div>
                    </div>
                    <div className="analytics-stat-card">
                        <div className="analytics-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>📉</div>
                        <div>
                            <p className="analytics-stat-label">Avg Monthly Expense</p>
                            <p className="analytics-stat-value">{formatCurrency(stats.avgMonthlyExpense)}</p>
                        </div>
                    </div>
                    <div className="analytics-stat-card">
                        <div className="analytics-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#6366f1' }}>💎</div>
                        <div>
                            <p className="analytics-stat-label">Savings Rate</p>
                            <p className="analytics-stat-value">{stats.savingsRate}%</p>
                        </div>
                    </div>
                    <div className="analytics-stat-card">
                        <div className="analytics-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>🔥</div>
                        <div>
                            <p className="analytics-stat-label">Highest Month</p>
                            <p className="analytics-stat-value">
                                {stats.highestSpendingMonth
                                    ? formatCompact(parseFloat(stats.highestSpendingMonth.total))
                                    : '—'}
                            </p>
                            {stats.highestSpendingMonth && (
                                <p className="analytics-stat-sub">{stats.highestSpendingMonth.month}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Monthly Income vs Expense Bar Chart */}
            <div className="chart-section">
                <div className="chart-card" style={{ flex: 1 }}>
                    <h3 className="chart-title">💰 Monthly Income vs Expense</h3>
                    {monthlySummary.length > 0 ? (
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={monthlySummary} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={formatCompact} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="income" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} maxBarSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <p>No monthly data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Savings Trend + Category Breakdown */}
            <div className="chart-section">
                <div className="chart-card">
                    <h3 className="chart-title">📈 Net Savings Trend</h3>
                    {savingsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={savingsData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                                <XAxis dataKey="label" stroke="var(--text-muted)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} tick={{ fill: 'var(--text-secondary)' }} tickFormatter={formatCompact} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="savings"
                                    name="Net Savings"
                                    stroke="#6366f1"
                                    fill="url(#savingsGradient)"
                                    strokeWidth={3}
                                />
                                <defs>
                                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <p>No data yet</p>
                        </div>
                    )}
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">🏆 Top Spending Categories</h3>
                    {topCategories.length > 0 ? (
                        <div className="top-categories-list">
                            {topCategories.map((cat, index) => (
                                <div key={cat.category} className="top-category-item">
                                    <div className="top-category-rank" style={{ background: COLORS[index % COLORS.length] + '22', color: COLORS[index % COLORS.length] }}>
                                        #{index + 1}
                                    </div>
                                    <div className="top-category-info">
                                        <div className="top-category-header">
                                            <span className="top-category-name">{cat.category}</span>
                                            <span className="top-category-amount">{formatCurrency(parseFloat(cat.total))}</span>
                                        </div>
                                        <div className="top-category-bar-bg">
                                            <div
                                                className="top-category-bar-fill"
                                                style={{
                                                    width: `${(parseFloat(cat.total) / maxCategoryTotal) * 100}%`,
                                                    background: COLORS[index % COLORS.length]
                                                }}
                                            />
                                        </div>
                                        <span className="top-category-count">{cat.count} transactions</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <p>No expense data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary Stats */}
            {stats && (
                <div className="analytics-summary-card">
                    <h3 className="chart-title">📋 Financial Summary</h3>
                    <div className="analytics-summary-grid">
                        <div className="analytics-summary-item">
                            <span className="analytics-summary-label">Total Income</span>
                            <span className="analytics-summary-value income">{formatCurrency(stats.totalIncome)}</span>
                        </div>
                        <div className="analytics-summary-item">
                            <span className="analytics-summary-label">Total Expenses</span>
                            <span className="analytics-summary-value expense">{formatCurrency(stats.totalExpense)}</span>
                        </div>
                        <div className="analytics-summary-item">
                            <span className="analytics-summary-label">Net Balance</span>
                            <span className={`analytics-summary-value ${stats.balance >= 0 ? 'income' : 'expense'}`}>
                                {formatCurrency(stats.balance)}
                            </span>
                        </div>
                        <div className="analytics-summary-item">
                            <span className="analytics-summary-label">Total Transactions</span>
                            <span className="analytics-summary-value">{stats.totalTransactions}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
