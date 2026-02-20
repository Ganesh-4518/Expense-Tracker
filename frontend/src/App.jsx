import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Income from './pages/Income';
import Expense from './pages/Expense';
import Budgets from './pages/Budgets';
import Savings from './pages/Savings';
import Reminders from './pages/Reminders';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                {children}
            </main>
        </div>
    );
};

// Public Route (redirect if logged in)
const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

function App() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <Router>
                    <Routes>
                        <Route
                            path="/login"
                            element={
                                <PublicRoute>
                                    <Login />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/signup"
                            element={
                                <PublicRoute>
                                    <Signup />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/forgot-password"
                            element={
                                <PublicRoute>
                                    <ForgotPassword />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/reset-password/:token"
                            element={
                                <PublicRoute>
                                    <ResetPassword />
                                </PublicRoute>
                            }
                        />
                        <Route
                            path="/dashboard"
                            element={
                                <ProtectedRoute>
                                    <Dashboard />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/income"
                            element={
                                <ProtectedRoute>
                                    <Income />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/expense"
                            element={
                                <ProtectedRoute>
                                    <Expense />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/budgets"
                            element={
                                <ProtectedRoute>
                                    <Budgets />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/savings"
                            element={
                                <ProtectedRoute>
                                    <Savings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/reminders"
                            element={
                                <ProtectedRoute>
                                    <Reminders />
                                </ProtectedRoute>
                            }
                        />
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
