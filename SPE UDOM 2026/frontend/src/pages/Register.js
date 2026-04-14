import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Toast from '../components/Toast';
import AuthSlideshow from '../components/AuthSlideshow';
import TopBanner from '../components/TopBanner';
import logo from '../assets/spe-udom-logo.png';
import './Auth.css';

const normalizeErrors = data => {
  if (!data || typeof data !== 'object') return { non_field_errors: ['Unable to process the server response.'] };
  if (data.details && typeof data.details === 'object') return normalizeErrors(data.details);
  if (typeof data.detail === 'string') return { non_field_errors: [data.detail] };
  if (typeof data.error === 'string') return { non_field_errors: [data.error] };
  if (typeof data.non_field_errors === 'string') return { non_field_errors: [data.non_field_errors] };
  return data;
};

const Register = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', phone: '', year_of_study: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    try {
      const response = await api('/auth/register/', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      
      if (response.ok) {
        setToast({ message: 'Registration successful! Welcome to SPE UDOM Chapter.', type: 'success' });
        login(response.data.user, response.data.tokens);
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        setErrors(normalizeErrors(response.data));
      }
    } catch (err) {
      setErrors({ non_field_errors: ['Cannot reach the server. Please make sure the backend is running.'] });
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
              <h2>Join SPE UDOM Student Chapter</h2>
              <p>Connect, learn, and grow with future energy professionals</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>Full Name</label>
                <input
                  name="full_name"
                  value={form.full_name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  autoComplete="name"
                  required
                />
                {errors.full_name && <span className="error">{errors.full_name}</span>}
              </div>
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
              <div className="form-row">
                <div className="form-group">
                  <label>Phone (Optional)</label>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="Phone"
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  {errors.phone && <span className="error">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label>Year of Study</label>
                  <select name="year_of_study" value={form.year_of_study} onChange={handleChange}>
                    <option value="">Select</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                  {errors.year_of_study && <span className="error">{errors.year_of_study}</span>}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min 12 chars"
                    autoComplete="new-password"
                    required
                  />
                  {errors.password && <span className="error">{errors.password}</span>}
                </div>
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={form.confirm_password}
                    onChange={handleChange}
                    placeholder="Confirm"
                    autoComplete="new-password"
                    required
                  />
                  {errors.confirm_password && <span className="error">{errors.confirm_password}</span>}
                </div>
              </div>
              {errors.non_field_errors && <p className="error">{errors.non_field_errors}</p>}
              <button type="submit" className="auth-btn" disabled={loading}>
                {loading ? 'Joining...' : 'Join Now'}
              </button>
            </form>
            <p className="auth-switch">Already have an account? <Link to="/login">Login</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
