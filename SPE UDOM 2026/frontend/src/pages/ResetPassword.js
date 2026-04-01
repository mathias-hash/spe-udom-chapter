import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Toast from '../components/Toast';
import { API_BASE } from '../utils/api';
import './Auth.css';

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm_password: '' });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    if (form.password !== form.confirm_password) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password/${uidb64}/${token}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: form.password }),
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: data.message, type: 'success' });
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setToast({ message: data.error || 'Reset failed.', type: 'error' });
      }
    } catch {
      setToast({ message: 'Server error. Please try again.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="auth-wrapper">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="auth-card">
        <div className="auth-header">
          <h2>SPE UDOM CHAPTER</h2>
          <p>Set your new password</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Min 6 characters" required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })}
              placeholder="Repeat password" required />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
        <p className="auth-switch"><Link to="/login">← Back to Login</Link></p>
      </div>
    </div>
  );
};

export default ResetPassword;
