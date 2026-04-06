import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, api } from '../utils/api';
import logo from '../assets/spe-udom-logo.png';
import './PageHeader.css';

const normalizeErrors = data => {
  if (!data || typeof data !== 'object') return { non_field_errors: ['Unable to process the server response.'] };
  if (typeof data.detail === 'string') return { non_field_errors: [data.detail] };
  if (typeof data.error === 'string') return { non_field_errors: [data.error] };
  return data;
};

const PageHeader = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'login' | 'register' | null
  const [dropOpen, setDropOpen] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});
  const [loginLoading, setLoginLoading] = useState(false);

  // Register form state
  const [regForm, setRegForm] = useState({ full_name: '', email: '', password: '', confirm_password: '', phone: '', year_of_study: '' });
  const [regErrors, setRegErrors] = useState({});
  const [regLoading, setRegLoading] = useState(false);

  const closeModal = () => {
    setModal(null);
    setLoginErrors({});
    setRegErrors({});
    setLoginForm({ email: '', password: '' });
    setRegForm({ full_name: '', email: '', password: '', confirm_password: '', phone: '', year_of_study: '' });
  };

  const handleLogin = async e => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginErrors({});
    try {
      const res = await apiLogin(loginForm.email, loginForm.password);
      if (res.ok) {
        login(res.data.user, res.data.tokens);
        closeModal();
        navigate('/dashboard');
      } else {
        setLoginErrors(normalizeErrors(res.data));
      }
    } catch {
      setLoginErrors({ non_field_errors: ['Cannot reach the server.'] });
    }
    setLoginLoading(false);
  };

  const handleRegister = async e => {
    e.preventDefault();
    setRegLoading(true);
    setRegErrors({});
    try {
      const res = await api('/auth/register/', { method: 'POST', body: JSON.stringify(regForm) });
      if (res.ok) {
        login(res.data.user, res.data.tokens);
        closeModal();
        navigate('/dashboard');
      } else {
        setRegErrors(normalizeErrors(res.data));
      }
    } catch {
      setRegErrors({ non_field_errors: ['Cannot reach the server.'] });
    }
    setRegLoading(false);
  };

  return (
    <>
      <div className="page-header">
        <img src={logo} alt="SPE UDOM" className="page-header-logo" />
        <div className="page-header-text">
          <span className="page-header-title">SPE UDOM</span>
          <span className="page-header-sub">Student Chapter</span>
        </div>
        <span className="page-header-tagline">Solutions. People. Energy.</span>

        {/* Auth avatar top-right */}
        <div className="ph-auth">
          {user ? (
            <div className="ph-avatar-wrap">
              <button className="ph-avatar" onClick={() => setDropOpen(o => !o)}>
                {user.full_name?.charAt(0).toUpperCase()}
              </button>
              {dropOpen && (
                <div className="ph-dropdown">
                  <span className="ph-drop-name">{user.full_name}</span>
                  <button onClick={() => { setDropOpen(false); navigate('/dashboard'); }}>Dashboard</button>
                  <button onClick={() => { setDropOpen(false); logout(); }}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="ph-auth-btns">
              <button className="ph-btn-login" onClick={() => setModal('login')}>Login</button>
              <button className="ph-btn-register" onClick={() => setModal('register')}>Register</button>
            </div>
          )}
        </div>
      </div>

      {/* Modal backdrop */}
      {modal && (
        <div className="ph-modal-backdrop" onClick={closeModal}>
          <div className="ph-modal" onClick={e => e.stopPropagation()}>
            <button className="ph-modal-close" onClick={closeModal}>✕</button>

            {modal === 'login' && (
              <>
                <h3>Welcome Back</h3>
                <p className="ph-modal-sub">Login to access your dashboard</p>
                <form onSubmit={handleLogin} className="ph-modal-form">
                  <input type="email" placeholder="Email" value={loginForm.email}
                    onChange={e => setLoginForm({ ...loginForm, email: e.target.value })} required />
                  {loginErrors.email && <span className="ph-error">{loginErrors.email}</span>}
                  <input type="password" placeholder="Password" value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
                  {loginErrors.password && <span className="ph-error">{loginErrors.password}</span>}
                  {loginErrors.non_field_errors && <span className="ph-error">{loginErrors.non_field_errors}</span>}
                  <button type="submit" disabled={loginLoading}>{loginLoading ? 'Signing in...' : 'Sign In'}</button>
                </form>
                <p className="ph-modal-switch">
                  <span onClick={() => { navigate('/forgot-password'); closeModal(); }} style={{ color: '#0066cc', cursor: 'pointer' }}>Forgot Password?</span>
                </p>
                <p className="ph-modal-switch">Don't have an account? <span onClick={() => setModal('register')}>Register</span></p>
              </>
            )}

            {modal === 'register' && (
              <>
                <h3>Join SPE UDOM</h3>
                <p className="ph-modal-sub">Connect, learn, and grow with future energy professionals</p>
                <form onSubmit={handleRegister} className="ph-modal-form">
                  <input placeholder="Full Name" value={regForm.full_name}
                    onChange={e => setRegForm({ ...regForm, full_name: e.target.value })} required />
                  {regErrors.full_name && <span className="ph-error">{regErrors.full_name}</span>}
                  <input type="email" placeholder="Email" value={regForm.email}
                    onChange={e => setRegForm({ ...regForm, email: e.target.value })} required />
                  {regErrors.email && <span className="ph-error">{regErrors.email}</span>}
                  <div className="ph-modal-row">
                    <div>
                      <input type="tel" placeholder="Phone (Optional)" value={regForm.phone}
                        onChange={e => setRegForm({ ...regForm, phone: e.target.value })} />
                      {regErrors.phone && <span className="ph-error">{regErrors.phone}</span>}
                    </div>
                    <div>
                      <select value={regForm.year_of_study} onChange={e => setRegForm({ ...regForm, year_of_study: e.target.value })}>
                        <option value="">Year of Study</option>
                        {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                      {regErrors.year_of_study && <span className="ph-error">{regErrors.year_of_study}</span>}
                    </div>
                  </div>
                  <div className="ph-modal-row">
                    <div>
                      <input type="password" placeholder="Password" value={regForm.password}
                        onChange={e => setRegForm({ ...regForm, password: e.target.value })} required />
                      {regErrors.password && <span className="ph-error">{regErrors.password}</span>}
                    </div>
                    <div>
                      <input type="password" placeholder="Confirm Password" value={regForm.confirm_password}
                        onChange={e => setRegForm({ ...regForm, confirm_password: e.target.value })} required />
                      {regErrors.confirm_password && <span className="ph-error">{regErrors.confirm_password}</span>}
                    </div>
                  </div>
                  {regErrors.non_field_errors && <span className="ph-error">{regErrors.non_field_errors}</span>}
                  <button type="submit" disabled={regLoading}>{regLoading ? 'Joining...' : 'Join Now'}</button>
                </form>
                <p className="ph-modal-switch">Already have an account? <span onClick={() => setModal('login')}>Login</span></p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PageHeader;
