import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);

        try {
            const apiUrl = `http://${window.location.hostname}:5000/api/auth/forgot-password`;
            const response = await axios.post(apiUrl, { email });
            setMessage(response.data.message);
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        }

        setLoading(false);
    };

    return (
        <div className="auth-page">
            <div className="auth-container-split">
                {/* Left Side - Form */}
                <div className="auth-form-section">
                    <div className="auth-form-wrapper">
                        <div className="auth-brand">
                            <div className="auth-brand-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </div>
                            <span>Forgot Password</span>
                        </div>

                        <p className="auth-welcome-text">
                            {submitted
                                ? "Check your email for reset instructions."
                                : "Enter your email and we'll send you a reset link."}
                        </p>

                        {error && <div className="auth-error">{error}</div>}
                        {message && <div className="auth-success">{message}</div>}

                        {!submitted ? (
                            <form className="auth-form" onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label className="form-label">Email Address</label>
                                    <div className="input-with-icon">
                                        <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="2" y="4" width="20" height="16" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                        <input
                                            type="email"
                                            className="form-input"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="btn btn-gradient"
                                    disabled={loading}
                                >
                                    {loading ? 'Sending...' : 'Send Reset Link'}
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                    </svg>
                                </button>
                            </form>
                        ) : (
                            <div className="reset-sent-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                                </svg>
                                <p>Email sent! Check your inbox.</p>
                            </div>
                        )}

                        <div className="auth-footer">
                            <p>Remember your password?</p>
                            <Link to="/login" className="auth-link">Back to Login</Link>
                        </div>
                    </div>
                </div>

                {/* Right Side - Welcome Panel */}
                <div className="auth-welcome-section">
                    <div className="auth-welcome-content">
                        <div className="auth-welcome-circles">
                            <div className="circle circle-1"></div>
                            <div className="circle circle-2"></div>
                            <div className="circle circle-3"></div>
                        </div>
                        <div className="auth-welcome-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h2 className="auth-welcome-title">RESET<br />PASSWORD</h2>
                        <p className="auth-welcome-subtitle">
                            Don't worry! We'll help you recover your account securely.
                        </p>
                        <div className="auth-welcome-dots">
                            <span className="dot active"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
