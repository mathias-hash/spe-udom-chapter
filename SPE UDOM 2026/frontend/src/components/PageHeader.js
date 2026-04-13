import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { login as apiLogin, api } from '../utils/api';
import logo from '../assets/spe-udom-logo.png';
import './PageHeader.css';

const DropdownIcon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="ph-drop-icon">
    {children}
  </svg>
);

const UserIcon = () => (
  <DropdownIcon>
    <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 19a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </DropdownIcon>
);

const DashboardIcon = () => (
  <DropdownIcon>
    <rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="4" width="7" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="17" width="7" height="3" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </DropdownIcon>
);

const SettingsIcon = () => (
  <DropdownIcon>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M19 12a7 7 0 0 0-.08-1l2-1.55-2-3.45-2.35.73a7.7 7.7 0 0 0-1.7-.98L14.5 3h-5l-.37 2.75a7.7 7.7 0 0 0-1.7.98l-2.35-.73-2 3.45 2 1.55A7 7 0 0 0 5 12c0 .34.03.68.08 1l-2 1.55 2 3.45 2.35-.73c.53.4 1.1.73 1.7.98L9.5 21h5l.37-2.75c.6-.25 1.17-.58 1.7-.98l2.35.73 2-3.45-2-1.55c.05-.32.08-.66.08-1Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </DropdownIcon>
);

const LogoutIcon = () => (
  <DropdownIcon>
    <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 16l4-4-4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12h9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </DropdownIcon>
);

const normalizeErrors = data => {
  if (!data || typeof data !== 'object') return { non_field_errors: ['Unable to process the server response.'] };
  if (typeof data.detail === 'string') return { non_field_errors: [data.detail] };
  if (typeof data.error === 'string') return { non_field_errors: [data.error] };
  if (typeof data.non_field_errors === 'string') return { non_field_errors: [data.non_field_errors] };
  return data;
};

const PageHeader = () => {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null); // 'login' | 'register' | 'profile' | null
  const [dropdownOpen, setDropdownOpen] = useState(false);

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

  // Lock background scroll when modal is open
  useEffect(() => {
    if (modal) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }
    return () => document.body.classList.remove('no-scroll');
  }, [modal]);

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

        {/* Auth section top-right */}
        <div className="ph-auth">
          {user ? (
            <div className="ph-avatar-wrap">
              <button className="ph-avatar" onClick={() => setDropdownOpen(o => !o)} title={user.full_name}>
                {user.full_name?.charAt(0).toUpperCase()}
              </button>
              <div className="ph-online-indicator-small" title="Online"></div>
              {dropdownOpen && (
                <div className="ph-dropdown">
                  <div className="ph-drop-item ph-drop-header">
                    <div className="ph-drop-avatar-wrap">
                      <div className="ph-drop-avatar">{user.full_name?.charAt(0).toUpperCase()}</div>
                      <div className="ph-online-indicator-small" title="Online"></div>
                    </div>
                    <div>
                      <div className="ph-drop-name">{user.full_name}</div>
                      <div className="ph-drop-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="ph-drop-divider"></div>
                  <button className="ph-drop-item" onClick={() => { setDropdownOpen(false); setModal('profile'); }}><UserIcon />View Profile</button>
                  <button className="ph-drop-item" onClick={() => { setDropdownOpen(false); navigate('/dashboard'); }}><DashboardIcon />Dashboard</button>
                  <button className="ph-drop-item" onClick={() => { setDropdownOpen(false); navigate('/settings'); }}><SettingsIcon />Settings</button>
                  <div className="ph-drop-divider"></div>
                  <button className="ph-drop-item ph-drop-logout" onClick={() => { setDropdownOpen(false); logout(); }}><LogoutIcon />Logout</button>
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
            <button className="ph-modal-close" onClick={closeModal} aria-label="Close dialog">&times;</button>

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

            {modal === 'profile' && user && (
              <>
                <h3>My Profile</h3>
                <p className="ph-modal-sub">Your account information</p>
                <div className="ph-profile-card">
                  <div className="ph-profile-avatar-wrapper">
                    <div className="ph-profile-avatar">{user.full_name?.charAt(0).toUpperCase()}</div>
                    <div className="ph-online-indicator" title="Online"></div>
                  </div>
                  <div className="ph-profile-info">
                    <div className="ph-profile-row">
                      <label>Name</label>
                      <span>{user.full_name}</span>
                    </div>
                    <div className="ph-profile-row">
                      <label>Email</label>
                      <span>{user.email}</span>
                    </div>
                    <div className="ph-profile-row">
                      <label>Role</label>
                      <span className="ph-role-badge">{user.role?.replace(/_/g, ' ').toUpperCase()}</span>
                    </div>
                    <div className="ph-profile-row">
                      <label>Year of Study</label>
                      <span>{user.year_of_study || 'Not specified'}</span>
                    </div>
                    <div className="ph-profile-row">
                      <label>Membership Status</label>
                      <span className="ph-membership-active">Active Member</span>
                    </div>
                    <div className="ph-profile-row">
                      <label>Last Login</label>
                      <span>{user.last_login ? new Date(user.last_login).toLocaleString() : '-'}</span>
                    </div>
                  </div>
                </div>
                <button type="button" onClick={closeModal} className="ph-modal-form" style={{ width: '100%', padding: '10px', background: '#0066cc', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', marginTop: '16px' }}>Close</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default PageHeader;
