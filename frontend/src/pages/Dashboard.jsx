import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { dashboardAPI, incomeAPI, expenseAPI, analyticsAPI } from '../api/api';
import { exportToExcel, formatCurrencyForExport, formatDateForExport } from '../utils/exportUtils';
import { useAuth } from '../context/AuthContext';
import BudgetOverview from '../components/BudgetOverview';
import SavingsOverview from '../components/SavingsOverview';
import UpcomingBills from '../components/UpcomingBills';
import SettingsButton from '../components/SettingsButton';

const Dashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        summary: { totalIncome: 0, totalExpense: 0, balance: 0 },
        dailyData: { income: [], expense: [] },
        recentTransactions: [],
        categoryData: { income: [], expense: [] }
    });
    const [yearlyData, setYearlyData] = useState([]);
    const [chartPeriod, setChartPeriod] = useState('weekly'); // 'weekly', 'monthly', 'yearly'

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboardRes, analyticsRes] = await Promise.all([
                dashboardAPI.getData(),
                analyticsAPI.getMonthlySummary()
            ]);
            setData(dashboardRes.data);
            setYearlyData(analyticsRes.data);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short'
        });
    };

    const handleExportReport = async () => {
        try {
            const [incomeRes, expenseRes, dashboardRes] = await Promise.all([
                incomeAPI.getAll(),
                expenseAPI.getAll(),
                dashboardAPI.getOverview()
            ]);

            const incomeData = incomeRes.data?.map(item => ({
                Title: item.title || '',
                Amount: formatCurrencyForExport(item.amount),
                Category: item.category || '',
                Date: formatDateForExport(item.date),
                Description: item.description || ''
            })) || [];

            const expenseData = expenseRes.data?.map(item => ({
                Title: item.title || '',
                Amount: formatCurrencyForExport(item.amount),
                Category: item.category || '',
                Date: formatDateForExport(item.date),
                Description: item.description || ''
            })) || [];

            const columns = [
                { key: 'Title', label: 'Title' },
                { key: 'Amount', label: 'Amount (₹)' },
                { key: 'Category', label: 'Category' },
                { key: 'Date', label: 'Date' },
                { key: 'Description', label: 'Description' }
            ];

            const summary = dashboardRes.data.summary;

            const sheets = [
                { name: 'Income', data: incomeData, columns },
                { name: 'Expenses', data: expenseData, columns },
                {
                    name: 'Summary',
                    data: [{
                        Label: 'Total Income',
                        Value: formatCurrencyForExport(summary.totalIncome)
                    }, {
                        Label: 'Total Expense',
                        Value: formatCurrencyForExport(summary.totalExpense)
                    }, {
                        Label: 'Balance',
                        Value: formatCurrencyForExport(summary.balance)
                    }],
                    columns: [{ key: 'Label', label: 'Summary' }, { key: 'Value', label: 'Amount (₹)' }]
                }
            ];

            const today = new Date().toISOString().split('T')[0];
            exportToExcel(sheets, `FinanceReport_${today}`);
        } catch (error) {
            console.error('Error exporting data:', error);
            alert('Failed to export data. Please try again.');
        }
    };

    // Prepare chart data based on selected period
    const prepareChartData = () => {
        if (chartPeriod === 'yearly') {
            return yearlyData.map(item => ({
                date: item.label.split(' ')[0], // e.g., "Jan", "Feb"
                income: item.income,
                expense: item.expense
            }));
        }

        const daysToKeep = chartPeriod === 'weekly' ? 7 : 30;
        const result = [];

        for (let i = daysToKeep - 1; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const incomeEntry = data.dailyData.income.find(d => d.day?.split('T')[0] === dateStr);
            const expenseEntry = data.dailyData.expense.find(d => d.day?.split('T')[0] === dateStr);

            result.push({
                date: chartPeriod === 'weekly'
                    ? date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })
                    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                income: parseFloat(incomeEntry?.total || 0),
                expense: parseFloat(expenseEntry?.total || 0)
            });
        }
        return result;
    };

    // Prepare expense category data for pie chart
    const getExpenseCategoryData = () => {
        if (!data.categoryData?.expense || data.categoryData.expense.length === 0) {
            return [];
        }
        return data.categoryData.expense.map(item => ({
            category: item.category,
            total: parseFloat(item.total) || 0
        })).filter(item => item.total > 0);
    };

    const COLORS = ['#6366f1', '#8b5cf6', '#d946ef', '#f472b6', '#22d3ee', '#10b981', '#f59e0b', '#ef4444'];



    if (loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="dashboard-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
                    <p className="dashboard-subtitle">Here's your financial overview</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={handleExportReport} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-card)' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Export Report</span>
                    </button>
                    <SettingsButton />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="dashboard-grid">
                <div className="stat-card income">
                    <div className="stat-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                            <polyline points="17 6 23 6 23 12" />
                        </svg>
                        Total Income
                    </div>
                    <div className="stat-value">{formatCurrency(data.summary.totalIncome)}</div>
                </div>

                <div className="stat-card expense">
                    <div className="stat-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                            <polyline points="17 18 23 18 23 12" />
                        </svg>
                        Total Expense
                    </div>
                    <div className="stat-value">{formatCurrency(data.summary.totalExpense)}</div>
                </div>

                <div className="stat-card balance">
                    <div className="stat-label">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="1" x2="12" y2="23" />
                            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                        </svg>
                        Balance
                    </div>
                    <div className="stat-value">{formatCurrency(data.summary.balance)}</div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="chart-section">
                <div className="chart-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h3 className="chart-title" style={{ margin: 0 }}>📈 Activity Overview</h3>
                        <div className="chart-filters" style={{ display: 'flex', background: 'var(--bg-primary)', padding: '0.25rem', borderRadius: 'var(--border-radius-sm)' }}>
                            <button
                                onClick={() => setChartPeriod('weekly')}
                                className={`period-btn ${chartPeriod === 'weekly' ? 'active' : ''}`}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    border: 'none',
                                    background: chartPeriod === 'weekly' ? 'var(--gradient-primary)' : 'transparent',
                                    color: chartPeriod === 'weekly' ? 'white' : 'var(--text-secondary)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: chartPeriod === 'weekly' ? '600' : '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Weekly
                            </button>
                            <button
                                onClick={() => setChartPeriod('monthly')}
                                className={`period-btn ${chartPeriod === 'monthly' ? 'active' : ''}`}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    border: 'none',
                                    background: chartPeriod === 'monthly' ? 'var(--gradient-primary)' : 'transparent',
                                    color: chartPeriod === 'monthly' ? 'white' : 'var(--text-secondary)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: chartPeriod === 'monthly' ? '600' : '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Monthly
                            </button>
                            <button
                                onClick={() => setChartPeriod('yearly')}
                                className={`period-btn ${chartPeriod === 'yearly' ? 'active' : ''}`}
                                style={{
                                    padding: '0.35rem 0.75rem',
                                    fontSize: '0.8125rem',
                                    border: 'none',
                                    background: chartPeriod === 'yearly' ? 'var(--gradient-primary)' : 'transparent',
                                    color: chartPeriod === 'yearly' ? 'white' : 'var(--text-secondary)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: chartPeriod === 'yearly' ? '600' : '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Yearly
                            </button>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepareChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                stroke="#a1a1aa"
                                fontSize={12}
                                minTickGap={20}
                                tickMargin={10}
                            />
                            <YAxis stroke="#a1a1aa" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    background: '#1a1a2e',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px'
                                }}
                                formatter={(value) => formatCurrency(value)}
                            />
                            <Line
                                type="monotone"
                                dataKey="income"
                                stroke="#10b981"
                                strokeWidth={3}
                                dot={{ fill: '#10b981', strokeWidth: 2 }}
                                name="Income"
                            />
                            <Line
                                type="monotone"
                                dataKey="expense"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ fill: '#ef4444', strokeWidth: 2 }}
                                name="Expense"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="chart-card">
                    <h3 className="chart-title">📊 Expense by Category</h3>
                    {getExpenseCategoryData().length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={getExpenseCategoryData()}
                                    dataKey="total"
                                    nameKey="category"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    innerRadius={50}
                                    paddingAngle={3}
                                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                    labelLine={true}
                                >
                                    {getExpenseCategoryData().map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-glass)',
                                        borderRadius: '8px',
                                        color: 'var(--text-primary)'
                                    }}
                                    formatter={(value, name) => [formatCurrency(value), name]}
                                />
                                <Legend
                                    layout="horizontal"
                                    align="center"
                                    verticalAlign="bottom"
                                    wrapperStyle={{ paddingTop: '10px' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state" style={{ padding: '2rem' }}>
                            <p>No expense data yet</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Transactions */}
            <div className="transactions-section">
                <div className="section-header">
                    <h3 className="section-title">💳 Recent Transactions</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Link to="/income" className="btn btn-income btn-sm">+ Income</Link>
                        <Link to="/expense" className="btn btn-expense btn-sm">+ Expense</Link>
                    </div>
                </div>

                {data.recentTransactions.length > 0 ? (
                    <div className="transaction-list">
                        {data.recentTransactions.map((transaction) => (
                            <div key={`${transaction.type}-${transaction.id}`} className="transaction-item">
                                <div className="transaction-info">
                                    <div className={`transaction-icon ${transaction.type}`}>
                                        {transaction.type === 'income' ? '↑' : '↓'}
                                    </div>
                                    <div className="transaction-details">
                                        <h4>{transaction.title}</h4>
                                        <p>{transaction.category} • {formatDate(transaction.date)}</p>
                                    </div>
                                </div>
                                <div className={`transaction-amount ${transaction.type}`}>
                                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📭</div>
                        <h3>No transactions yet</h3>
                        <p>Start by adding your income or expenses</p>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                            <Link to="/income" className="btn btn-income">Add Income</Link>
                            <Link to="/expense" className="btn btn-expense">Add Expense</Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Dashboard Widgets */}
            <div className="dashboard-widgets-row">
                <BudgetOverview />
                <SavingsOverview />
                <UpcomingBills />
            </div>
        </div>
    );
};

export default Dashboard;
