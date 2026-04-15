import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Toast from '../../components/Toast';
import SiteFooter from '../../components/SiteFooter';
import TopBanner from '../../components/TopBanner';
import PageHeader from '../../components/PageHeader';
import './DashboardLayout.css';

const menuByRole = {
  admin: [
    { path: '/dashboard', label: 'Overview' },
    { path: '/dashboard/users', label: 'Manage Users' },
    { path: '/dashboard/online-users', label: '🟢 Online Users' },
    { path: '/dashboard/events', label: 'Manage Events' },
    { path: '/dashboard/announcements', label: 'Announcements' },
    { path: '/dashboard/publications', label: 'Publications' },
    { path: '/dashboard/elections', label: 'Elections' },
    { path: '/dashboard/analytics', label: 'Analytics' },
    { path: '/dashboard/suggestions', label: 'Suggestions' },
    { path: '/dashboard/leadership', label: 'Leadership' },
    { path: '/dashboard/annual-report', label: 'Annual Report' },
    { path: '/dashboard/profile', label: 'Profile' },
    { path: '/contact', label: 'Contact' },
  ],
  president: [
    { path: '/dashboard', label: 'Overview' },
    { path: '/dashboard/members', label: 'Members' },
    { path: '/dashboard/events', label: 'Events' },
    { path: '/dashboard/approvals', label: 'Approvals' },
    { path: '/dashboard/announcements', label: 'Announcements' },
    { path: '/dashboard/suggestions', label: 'Suggestions' },
    { path: '/dashboard/leadership', label: 'Leadership' },
    { path: '/dashboard/reports', label: 'Reports' },
    { path: '/contact', label: 'Contact' },
  ],
  general_secretary: [
    { path: '/dashboard', label: 'Overview' },
    { path: '/dashboard/elections', label: 'Elections' },
    { path: '/dashboard/candidates', label: 'Candidates' },
    { path: '/dashboard/results', label: 'Results' },
    { path: '/dashboard/analytics', label: 'Analytics' },
    { path: '/dashboard/publications', label: 'Publications' },
    { path: '/dashboard/leadership', label: 'Leadership' },
    { path: '/dashboard/annual-report', label: 'Annual Report' },
    { path: '/dashboard/records', label: 'Records' },
    { path: '/contact', label: 'Contact' },
  ],
  member: [
    { path: '/dashboard', label: 'Overview' },
    { path: '/dashboard/events', label: 'Events' },
    { path: '/dashboard/publications', label: 'Publications' },
    { path: '/dashboard/annual-report', label: 'Annual Report' },
    { path: '/dashboard/leadership', label: 'Leadership' },
    { path: '/dashboard/elections', label: 'Vote' },
    { path: '/dashboard/profile', label: 'Profile' },
    { path: '/dashboard/suggestions', label: 'Suggestions' },
    { path: '/contact', label: 'Contact' },
  ],
};

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [toast, setToast] = useState(null);

  const menu = menuByRole[user?.role] || menuByRole.member;

  const handleLogout = () => {
    logout();
    setToast({ message: `Goodbye ${user?.full_name}! See you next time.`, type: 'success' });
    setTimeout(() => navigate('/login'), 1200);
  };

  return (
    <div className="dash-wrapper">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <TopBanner />
      <PageHeader />
      {sidebarOpen && window.innerWidth < 768 && (
        <div className="dash-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`dash-sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="dash-role-badge">{user?.role?.replace('_', ' ').toUpperCase()}</div>
        <nav className="dash-nav">
          {menu.map(({ path, label }) => (
            <Link
              key={path}
              to={path}
              className={`dash-link ${location.pathname === path ? 'active' : ''}`}
              onClick={() => window.innerWidth < 768 && setSidebarOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <button className="dash-logout" onClick={handleLogout}>Logout</button>
      </aside>

      <div className={`dash-main ${sidebarOpen ? '' : 'expanded'}`}>
        <header className="dash-topbar">
          <button 
            className={`dash-toggle ${sidebarOpen ? 'open' : ''}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </header>
        <main className="dash-content">{children}</main>
        <SiteFooter />
      </div>
    </div>
  );
};

export default DashboardLayout;
