import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin } from '../utils/api';
import Toast from '../components/Toast';
import AuthSlideshow from '../components/AuthSlideshow';
import TopBanner from '../components/TopBanner';
import logo from '../assets/spe-udom-logo.png';
import './Auth.css';

const normalizeErrors = data => {
  if (!data || typeof data !== 'object') return { non_field_errors: ['Unable to process the server response.'] };
  if (typeof data.detail === 'string') return { non_field_errors: [data.detail] };
  if (typeof data.error === 'string') return { non_field_errors: [data.error] };
  if (typeof data.non_field_errors === 'string') return { non_field_errors: [data.non_field_errors] };
  return data;
};

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const response = await apiLogin(form.email, form.password);
      if (response.ok) {
        setToast({ message: `Welcome back, ${response.data.user?.full_name}!`, type: 'success' });
        login(response.data.user, response.data.tokens);
        setTimeout(() => navigate('/dashboard'), 1200);
      } else {
        // Better error diagnosis
        const errorData = normalizeErrors(response.data);
        if (!errorData.non_field_errors || errorData.non_field_errors.length === 0) {
          // Check if it's a server connectivity issue
          if (response.status === 0) {
            setErrors({ non_field_errors: ['Cannot reach the backend server. Make sure it\'s running on http://localhost:8000'] });
          } else if (response.status >= 500) {
            setErrors({ non_field_errors: ['Server error. Please try again later.'] });
          } else if (response.status === 400 && !response.data.email && !response.data.password) {
            setErrors({ non_field_errors: ['Invalid email or password. Please try again.'] });
          } else {
            setErrors(errorData);
          }
        } else {
          setErrors(errorData);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setErrors({ non_field_errors: ['An unexpected error occurred. Please try again.'] });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page-wrapper">
      {/* Sidebar */}
      <aside className="auth-sidebar">
        <div className="auth-sidebar-header">
          <img src={logo} alt="SPE" style={{ height: '32px', width: 'auto' }} />
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', marginLeft: '8px' }}>SPE UDOM</span>
        </div>
        <nav className="auth-sidebar-nav">
          <Link to="/" className="auth-sidebar-link">🏠 Home</Link>
          <Link to="/events" className="auth-sidebar-link">📅 Events</Link>
          <Link to="/publications" className="auth-sidebar-link">📚 Publications</Link>
          <Link to="/leadership" className="auth-sidebar-link">👥 Leadership</Link>
        </nav>
      </aside>

      {/* Main Auth Content */}
      <div className="auth-wrapper">
        <TopBanner />
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

        {/* Left — Slideshow */}
        <div className="auth-slideshow-panel">
          <AuthSlideshow />
        </div>

        {/* Right — Form */}
        <div className="auth-form-panel">
          <div className="auth-card">
            <div className="auth-header">
              <h2>Welcome Back</h2>
              <p>Login to access your dashboard</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Email"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  inputMode="email"
                  required
                />
                {errors.email && <span className="error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                />
                {errors.password && <span className="error">{errors.password}</span>}
              </div>
              {errors.non_field_errors && <p className="error">{errors.non_field_errors}</p>}
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <p className="auth-switch"><Link to="/forgot-password">Forgot Password?</Link></p>
            <p className="auth-switch">Don't have an account? <Link to="/register">Register</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
