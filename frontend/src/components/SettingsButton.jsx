import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const SettingsButton = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const panelRef = useRef(null);
    const buttonRef = useRef(null);

    // Close panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleProfileClick = () => {
        setIsOpen(false);
        navigate('/profile');
    };

    const handleLogout = () => {
        setIsOpen(false);
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-settings-container" style={{ position: 'relative' }}>
            <button
                ref={buttonRef}
                className={`dashboard-settings-btn ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Settings"
                title="Settings"
            >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
            </button>

            {isOpen && (
                <div ref={panelRef} className="dashboard-settings-panel">
                    <div className="settings-panel-header">
                        <h3>Settings</h3>
                    </div>

                    <div className="settings-profile-section" onClick={handleProfileClick}>
                        <div className="settings-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="settings-profile-info">
                            <p className="settings-profile-name">{user?.name || 'User'}</p>
                            <p className="settings-profile-email">{user?.email || ''}</p>
                        </div>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                    </div>

                    <div className="settings-divider"></div>

                    <label className="settings-item theme-toggle-item" style={{ cursor: 'pointer' }}>
                        <div className="settings-item-left">
                            <div className="settings-item-icon">
                                {theme === 'light' ? '☀️' : '🌙'}
                            </div>
                            <div>
                                <p className="settings-item-label">Dark Mode</p>
                                <p className="settings-item-desc">
                                    {theme === 'light' ? 'Currently light' : 'Currently dark'}
                                </p>
                            </div>
                        </div>
                        <div className="settings-toggle">
                            <input
                                type="checkbox"
                                checked={theme === 'dark'}
                                onChange={toggleTheme}
                            />
                            <span className="settings-toggle-slider"></span>
                        </div>
                    </label>

                    <button className="settings-item" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--expense)', fontFamily: 'inherit', fontSize: '0.9375rem' }}>
                        <div className="settings-item-left" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div className="settings-item-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--expense)', padding: '0.5rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                    <polyline points="16 17 21 12 16 7" />
                                    <line x1="21" y1="12" x2="9" y2="12" />
                                </svg>
                            </div>
                            <div>
                                <p className="settings-item-label" style={{ margin: 0, fontWeight: 500 }}>Logout</p>
                                <p className="settings-item-desc" style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Sign out of your account
                                </p>
                            </div>
                        </div>
                    </button>
                </div>
            )}
        </div>
    );
};

export default SettingsButton;
