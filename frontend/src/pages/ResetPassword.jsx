import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [validToken, setValidToken] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Verify token on mount
        const verifyToken = async () => {
            try {
                const apiUrl = `http://${window.location.hostname}:5000/api/auth/verify-reset-token/${token}`;
                const response = await axios.get(apiUrl);
                setValidToken(response.data.valid);
            } catch (err) {
                setValidToken(false);
                setError('This reset link is invalid or has expired.');
            }
        };
        verifyToken();
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const apiUrl = `http://${window.location.hostname}:5000/api/auth/reset-password/${token}`;
            const response = await axios.post(apiUrl, { password });
            setMessage(response.data.message);
            setSuccess(true);

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    // Loading state
    if (validToken === null) {
        return (
            <div className="auth-page">
                <div className="loading">
                    <div className="spinner"></div>
                    <p>Verifying reset link...</p>
                </div>
            </div>
        );
    }

    // Invalid token
    if (validToken === false) {
        return (
            <div className="auth-page">
                <div className="auth-container-split" style={{ maxWidth: '500px' }}>
                    <div className="auth-form-section" style={{ flex: 1 }}>
                        <div className="auth-form-wrapper">
                            <div className="auth-brand" style={{ color: '#ef4444' }}>
                                <div className="auth-brand-icon" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M15 9l-6 6M9 9l6 6" />
                                    </svg>
                                </div>
                                <span>Link Expired</span>
                            </div>

                            <p className="auth-welcome-text">
                                This password reset link is invalid or has expired.
                            </p>

                            <div className="auth-footer">
                                <Link to="/forgot-password" className="btn btn-gradient" style={{ display: 'inline-flex', gap: '0.5rem' }}>
                                    Request New Link
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container-split">
                {/* Left Side - Form */}
                <div className="auth-form-section">
                    <div className="auth-form-wrapper">
                        <div className="auth-brand" style={{ color: success ? '#10b981' : '#22d3ee' }}>
                            <div className="auth-brand-icon" style={success ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' } : {}}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    {success ? (
                                        <><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></>
                                    ) : (
                                        <><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>
                                    )}
                                </svg>
                            </div>
                            <span>{success ? 'Success!' : 'New Password'}</span>
                        </div>

                        <p className="auth-welcome-text">
                            {success
                                ? "Your password has been reset. Redirecting to login..."
                                : "Enter your new password below."}
                        </p>

                        {error && <div className="auth-error">{error}</div>}
                        {message && <div className="auth-success">{message}</div>}

                        {!success && (
                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">New Password</label>
                                    <div className="input-with-icon">
                                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Confirm Password</label>
                                    <div className="input-with-icon">
                                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        <input
                                            type="password"
                                            className="form-input"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-gradient"
                                    disabled={loading}
                                >
                                    {loading ? 'Resetting...' : 'Reset Password'}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </form>
                        )}

                        <div className="auth-footer">
                            <p>Remember your password?</p>
                            <Link to="/login" className="auth-link">Back to Login</Link>
                        </div>
                    </div>
                </div>

                {/* Right Side - Welcome Panel */}
                <div className="auth-welcome-section" style={success ? { background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)' } : {}}>
                    <div className="auth-welcome-content">
                        <div className="auth-welcome-circles">
                            <div className="circle circle-1"></div>
                            <div className="circle circle-2"></div>
                            <div className="circle circle-3"></div>
                        </div>
                        <div className="auth-welcome-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                {success ? (
                                    <><path d="M9 12l2 2 4-4" /><circle cx="12" cy="12" r="10" /></>
                                ) : (
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                )}
                            </svg>
                        </div>
                        <h2 className="auth-welcome-title">{success ? 'PASSWORD\nRESET!' : 'SECURE\nRESET'}</h2>
                        <p className="auth-welcome-subtitle">
                            {success
                                ? "Your account is now secured with your new password."
                                : "Create a strong password to keep your account safe."}
                        </p>
                        <div className="auth-welcome-dots">
                            <span className="dot"></span>
                            <span className="dot active"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
