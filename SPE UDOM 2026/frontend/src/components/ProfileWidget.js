import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './ProfileWidget.css';

const BaseIcon = ({ children }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pw-icon">
    {children}
  </svg>
);

const ChevronIcon = ({ open }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={`pw-chevron-icon ${open ? 'open' : ''}`}>
    <path d="M7 10l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ViewProfileIcon = () => (
  <BaseIcon>
    <circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M5 19a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

const EditProfileIcon = () => (
  <BaseIcon>
    <path d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    <path d="M13.5 8 16 5.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L16.5 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

const DashboardIcon = () => (
  <BaseIcon>
    <rect x="4" y="4" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="4" width="7" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="13" y="17" width="7" height="3" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
  </BaseIcon>
);

const MembershipIcon = () => (
  <BaseIcon>
    <path d="M7 7.5h10a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2Z" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9 7.5V6a3 3 0 0 1 6 0v1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M9.5 12h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

const EventsIcon = () => (
  <BaseIcon>
    <rect x="4" y="6" width="16" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M8 4v4M16 4v4M4 10h16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

const SettingsIcon = () => (
  <BaseIcon>
    <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M19 12a7 7 0 0 0-.08-1l2-1.55-2-3.45-2.35.73a7.7 7.7 0 0 0-1.7-.98L14.5 3h-5l-.37 2.75a7.7 7.7 0 0 0-1.7.98l-2.35-.73-2 3.45 2 1.55A7 7 0 0 0 5 12c0 .34.03.68.08 1l-2 1.55 2 3.45 2.35-.73c.53.4 1.1.73 1.7.98L9.5 21h5l.37-2.75c.6-.25 1.17-.58 1.7-.98l2.35.73 2-3.45-2-1.55c.05-.32.08-.66.08-1Z" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </BaseIcon>
);

const HelpIcon = () => (
  <BaseIcon>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <path d="M9.75 9.5a2.45 2.45 0 1 1 4.3 1.58c-.67.8-1.55 1.26-1.8 2.17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="16.9" r="1" fill="currentColor" />
  </BaseIcon>
);

const LogoutIcon = () => (
  <BaseIcon>
    <path d="M10 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M14 16l4-4-4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M9 12h9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </BaseIcon>
);

const AUTH_PATHS = ['/login', '/register', '/forgot-password'];

const ProfileWidget = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  if (
    AUTH_PATHS.some((path) => location.pathname.startsWith(path)) ||
    location.pathname.startsWith('/reset-password') ||
    location.pathname.startsWith('/dashboard')
  ) {
    return null;
  }

  if (!user) return null;

  const initials = user.full_name
    ? user.full_name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join('')
    : '?';

  const firstName = user.full_name?.split(' ').filter(Boolean)[0] || 'Profile';

  const menuItems = [
    { label: 'View Profile', icon: <ViewProfileIcon />, action: () => navigate('/dashboard/profile') },
    { label: 'Edit Profile', icon: <EditProfileIcon />, action: () => navigate('/dashboard/profile') },
    { label: 'Dashboard', icon: <DashboardIcon />, action: () => navigate('/dashboard') },
    { divider: true },
    { label: 'My Membership', icon: <MembershipIcon />, action: () => navigate('/join') },
    { label: 'My Events', icon: <EventsIcon />, action: () => navigate('/events') },
    { divider: true },
    { label: 'Settings', icon: <SettingsIcon />, action: () => navigate('/dashboard/profile') },
    { label: 'Help / Support', icon: <HelpIcon />, action: () => navigate('/contact') },
  ];

  const handleMenuAction = (action) => {
    setOpen(false);
    action();
  };

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/login');
  };

  return (
    <div className="pw-wrap" ref={ref}>
      <button className="pw-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <span className="pw-avatar">{initials}</span>
        <span className="pw-name">{firstName}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="pw-dropdown">
          <div className="pw-header">
            <div className="pw-avatar pw-avatar-lg">{initials}</div>
            <div className="pw-info">
              <strong>{user.full_name || 'Guest'}</strong>
              <span>{user.email || ''}</span>
              {user.role && (
                <span className={`pw-role pw-role-${user.role}`}>
                  {user.role.replace('_', ' ')}
                </span>
              )}
            </div>
          </div>

          <div className="pw-divider" />

          <div className="pw-menu">
            {menuItems.map((item, index) =>
              item.divider ? (
                <div key={`divider-${index}`} className="pw-divider" />
              ) : (
                <button
                  key={item.label}
                  className="pw-item"
                  onClick={() => handleMenuAction(item.action)}
                  type="button"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              )
            )}

            <div className="pw-divider" />

            <button className="pw-item pw-logout" onClick={handleLogout} type="button">
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileWidget;
