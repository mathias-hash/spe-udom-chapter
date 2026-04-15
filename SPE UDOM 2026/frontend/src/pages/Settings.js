import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { api } from '../utils/api';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordErrors({});

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setPasswordErrors({ confirm_password: ['Passwords do not match'] });
      setPasswordLoading(false);
      return;
    }

    if (passwordForm.new_password.length < 8) {
      setPasswordErrors({ new_password: ['Password must be at least 8 characters'] });
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await api('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password
        })
      });

      if (res.ok) {
        setToast({ message: 'Password changed successfully! 🔐', type: 'success' });
        setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      } else {
        const data = res.data || {};
        if (data.current_password) {
          setPasswordErrors({ current_password: data.current_password });
        } else if (data.non_field_errors) {
          setPasswordErrors({ non_field_errors: data.non_field_errors });
        } else {
          setPasswordErrors({ non_field_errors: ['Failed to change password'] });
        }
      }
    } catch (error) {
      setPasswordErrors({ non_field_errors: ['Cannot reach the server'] });
    }
    setPasswordLoading(false);
  };

  return (
    <div className="settings-container">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="settings-card">
        <h2>Account Settings</h2>
        
        {/* User Info */}
        <div className="settings-section">
          <h3>Account Information</h3>
          <div className="info-row">
            <label>Name</label>
            <span>{user?.full_name}</span>
          </div>
          <div className="info-row">
            <label>Email</label>
            <span>{user?.email}</span>
          </div>
        </div>

        {/* Change Password */}
        <div className="settings-section">
          <h3>Change Password</h3>
          <form onSubmit={handlePasswordChange} className="settings-form">
            <div className="form-group">
              <label htmlFor="current_password">Confirm Current Password</label>
              <input
                id="current_password"
                type="password"
                placeholder="Enter your current password"
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                required
              />
              {passwordErrors.current_password && (
                <span className="error-message">{passwordErrors.current_password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="new_password">New Password</label>
              <input
                id="new_password"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                required
              />
              {passwordErrors.new_password && (
                <span className="error-message">{passwordErrors.new_password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm_password">Confirm New Password</label>
              <input
                id="confirm_password"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                required
              />
              {passwordErrors.confirm_password && (
                <span className="error-message">{passwordErrors.confirm_password}</span>
              )}
            </div>

            {passwordErrors.non_field_errors && (
              <div className="error-banner">{passwordErrors.non_field_errors}</div>
            )}

            <button type="submit" disabled={passwordLoading} className="submit-btn">
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
