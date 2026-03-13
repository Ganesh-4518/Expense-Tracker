import { useState, useEffect } from 'react';
import { profileAPI } from '../api/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user, login } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');

    // Profile form
    const [profileForm, setProfileForm] = useState({ name: '', email: '' });
    const [profileMsg, setProfileMsg] = useState({ text: '', type: '' });
    const [profileSaving, setProfileSaving] = useState(false);

    // Password form
    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordMsg, setPasswordMsg] = useState({ text: '', type: '' });
    const [passwordSaving, setPasswordSaving] = useState(false);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await profileAPI.get();
            setProfile(response.data);
            setProfileForm({
                name: response.data.name,
                email: response.data.email
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileSaving(true);
        setProfileMsg({ text: '', type: '' });

        try {
            const response = await profileAPI.update(profileForm);
            setProfileMsg({ text: response.data.message, type: 'success' });

            // Update local auth context
            const updatedUser = response.data.user;
            localStorage.setItem('user', JSON.stringify(updatedUser));
            window.location.reload();
        } catch (error) {
            setProfileMsg({
                text: error.response?.data?.message || 'Failed to update profile',
                type: 'error'
            });
        } finally {
            setProfileSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordSaving(true);
        setPasswordMsg({ text: '', type: '' });

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setPasswordMsg({ text: 'New passwords do not match', type: 'error' });
            setPasswordSaving(false);
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setPasswordMsg({ text: 'New password must be at least 6 characters', type: 'error' });
            setPasswordSaving(false);
            return;
        }

        try {
            const response = await profileAPI.changePassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword
            });
            setPasswordMsg({ text: response.data.message, type: 'success' });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setPasswordMsg({
                text: error.response?.data?.message || 'Failed to change password',
                type: 'error'
            });
        } finally {
            setPasswordSaving(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

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
                    <h1 className="page-title">👤 Profile & Settings</h1>
                    <p className="dashboard-subtitle">Manage your account</p>
                </div>
            </div>

            {/* Profile Card */}
            <div className="profile-hero-card">
                <div className="profile-avatar-large">
                    {profile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="profile-hero-info">
                    <h2 className="profile-hero-name">{profile?.name}</h2>
                    <p className="profile-hero-email">{profile?.email}</p>
                    <p className="profile-hero-joined">Member since {profile?.created_at ? formatDate(profile.created_at) : '—'}</p>
                </div>
                {profile?.stats && (
                    <div className="profile-quick-stats">
                        <div className="profile-quick-stat">
                            <span className="profile-quick-stat-value">{parseInt(profile.stats.income_count) + parseInt(profile.stats.expense_count)}</span>
                            <span className="profile-quick-stat-label">Transactions</span>
                        </div>
                        <div className="profile-quick-stat">
                            <span className="profile-quick-stat-value income">{formatCurrency(profile.stats.total_income)}</span>
                            <span className="profile-quick-stat-label">Total Income</span>
                        </div>
                        <div className="profile-quick-stat">
                            <span className="profile-quick-stat-value expense">{formatCurrency(profile.stats.total_expense)}</span>
                            <span className="profile-quick-stat-label">Total Expenses</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Tabs */}
            <div className="profile-tabs">
                <button
                    className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
                    onClick={() => setActiveTab('profile')}
                >
                    ✏️ Edit Profile
                </button>
                <button
                    className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
                    onClick={() => setActiveTab('password')}
                >
                    🔒 Change Password
                </button>
            </div>

            {/* Edit Profile */}
            {activeTab === 'profile' && (
                <div className="profile-settings-card">
                    <h3 className="profile-settings-title">Edit Profile</h3>
                    <form onSubmit={handleProfileUpdate}>
                        <div className="form-group">
                            <label className="form-label">Full Name</label>
                            <input
                                type="text"
                                className="form-input"
                                value={profileForm.name}
                                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                type="email"
                                className="form-input"
                                value={profileForm.email}
                                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                                required
                            />
                        </div>
                        {profileMsg.text && (
                            <div className={`profile-message ${profileMsg.type}`}>
                                {profileMsg.type === 'success' ? '✅' : '❌'} {profileMsg.text}
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                            {profileSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>
            )}

            {/* Change Password */}
            {activeTab === 'password' && (
                <div className="profile-settings-card">
                    <h3 className="profile-settings-title">Change Password</h3>
                    <form onSubmit={handlePasswordChange}>
                        <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwordForm.currentPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="At least 6 characters"
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Confirm New Password</label>
                            <input
                                type="password"
                                className="form-input"
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                required
                            />
                        </div>
                        {passwordMsg.text && (
                            <div className={`profile-message ${passwordMsg.type}`}>
                                {passwordMsg.type === 'success' ? '✅' : '❌'} {passwordMsg.text}
                            </div>
                        )}
                        <button type="submit" className="btn btn-primary" disabled={passwordSaving}>
                            {passwordSaving ? 'Changing...' : 'Change Password'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export default Profile;
