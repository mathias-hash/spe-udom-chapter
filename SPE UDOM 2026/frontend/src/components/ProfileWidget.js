import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileWidget.css';

const DashboardIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pw-icon">
    <path d="M3 11.5 12 4l9 7.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M5.5 10.5V20h13V10.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9.5 20v-5h5v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pw-icon">
    <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 19a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pw-icon">
    <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 16l4-4-4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12h9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const LoginIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pw-icon">
    <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 16l4-4-4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12h9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const RegisterIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pw-icon">
    <circle cx="9" cy="8" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M3.5 18a5.5 5.5 0 0 1 11 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M17 8v6M14 11h6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const ProfileWidget = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const initials = user?.full_name
    ? user.full_name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')
    : '?';

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <div className="pw-wrap" ref={ref}>
      <button className="pw-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="pw-avatar">{initials}</span>
        {user && <span className="pw-name">{user.full_name?.split(' ')[0]}</span>}
        <span className="pw-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="pw-dropdown">
          <div className="pw-header">
            <div className="pw-avatar pw-avatar-lg">{initials}</div>
            <div className="pw-info">
              <strong>{user?.full_name || 'Guest'}</strong>
              <span>{user?.email || ''}</span>
              {user?.role && (
                <span className={`pw-role pw-role-${user.role}`}>
                  {user.role.replace('_', ' ').toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="pw-divider" />

          <div className="pw-menu">
            {user ? (
              <>
                <Link to="/dashboard" className="pw-item" onClick={() => setOpen(false)}>
                  <DashboardIcon />
                  <span>Dashboard</span>
                </Link>
                <Link to="/dashboard/profile" className="pw-item" onClick={() => setOpen(false)}>
                  <ProfileIcon />
                  <span>Profile</span>
                </Link>
                <div className="pw-divider" />
                <button className="pw-item pw-logout" onClick={handleLogout}>
                  <LogoutIcon />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="pw-item" onClick={() => setOpen(false)}>
                  <LoginIcon />
                  <span>Login</span>
                </Link>
                <Link to="/register" className="pw-item" onClick={() => setOpen(false)}>
                  <RegisterIcon />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileWidget;
