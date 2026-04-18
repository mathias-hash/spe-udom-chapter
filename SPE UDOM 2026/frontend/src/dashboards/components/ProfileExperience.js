import React from 'react';
import { useNavigate } from 'react-router-dom';

const iconBase = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const EditIcon = () => (
  <svg {...iconBase}>
    <path d="M4 17.5V20h2.5L17 9.5 14.5 7 4 17.5Z" />
    <path d="M13.5 8 16 5.5a1.8 1.8 0 0 1 2.5 0l.5.5a1.8 1.8 0 0 1 0 2.5L16.5 11" />
  </svg>
);

const ShieldIcon = () => (
  <svg {...iconBase}>
    <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3Z" />
    <path d="m9.5 12 1.7 1.7 3.6-3.9" />
  </svg>
);

const MembershipIcon = () => (
  <svg {...iconBase}>
    <rect x="4" y="7" width="16" height="10" rx="2" />
    <path d="M8 7V5.8A2.2 2.2 0 0 1 10.2 3.6h3.6A2.2 2.2 0 0 1 16 5.8V7" />
    <path d="M9.5 12h5" />
  </svg>
);

const CalendarIcon = () => (
  <svg {...iconBase}>
    <rect x="4" y="6" width="16" height="14" rx="2" />
    <path d="M8 4v4M16 4v4M4 10h16" />
  </svg>
);

const DashboardIcon = () => (
  <svg {...iconBase}>
    <rect x="4" y="4" width="7" height="7" rx="1.5" />
    <rect x="13" y="4" width="7" height="11" rx="1.5" />
    <rect x="4" y="13" width="7" height="7" rx="1.5" />
    <rect x="13" y="17" width="7" height="3" rx="1.5" />
  </svg>
);

const HelpIcon = () => (
  <svg {...iconBase}>
    <circle cx="12" cy="12" r="8" />
    <path d="M9.8 9.6a2.4 2.4 0 1 1 4.2 1.6c-.65.78-1.48 1.2-1.73 2.08" />
    <circle cx="12" cy="16.8" r=".7" fill="currentColor" stroke="none" />
  </svg>
);

const tones = {
  blue: { bg: 'linear-gradient(135deg, #eff6ff, #dbeafe)', accent: '#1d4ed8' },
  teal: { bg: 'linear-gradient(135deg, #ecfeff, #ccfbf1)', accent: '#0f766e' },
  violet: { bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)', accent: '#7c3aed' },
  rose: { bg: 'linear-gradient(135deg, #fff1f2, #ffe4e6)', accent: '#be123c' },
};

const scrollToId = (id) => {
  const node = document.getElementById(id);
  if (node) {
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const ProfileExperience = ({ user, roleLabel, accent = 'blue' }) => {
  const navigate = useNavigate();
  const tone = tones[accent] || tones.blue;

  const joinedDate = user?.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Not available';

  const overviewItems = [
    { label: 'Membership Status', value: 'Active Member' },
    { label: 'Year of Study', value: user?.year_of_study ? `Year ${user.year_of_study}` : 'Not set' },
    { label: 'Phone Number', value: user?.phone || 'Not set' },
    { label: 'Member Since', value: joinedDate },
  ];

  const actionItems = [
    { label: 'Edit Profile', note: 'Update your contact and academic details.', icon: <EditIcon />, action: () => scrollToId('profile-edit-section') },
    { label: 'Security Settings', note: 'Change your password and secure your account.', icon: <ShieldIcon />, action: () => scrollToId('profile-security-section') },
    { label: 'My Membership', note: 'Review membership information and chapter access.', icon: <MembershipIcon />, action: () => navigate('/join') },
    { label: 'My Events', note: 'See chapter events, sessions, and activities.', icon: <CalendarIcon />, action: () => navigate('/events') },
    { label: 'Dashboard', note: 'Return to your main dashboard workspace.', icon: <DashboardIcon />, action: () => navigate('/dashboard') },
    { label: 'Help / Support', note: 'Contact the chapter team when you need help.', icon: <HelpIcon />, action: () => navigate('/contact') },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr', gap: 24, marginBottom: 24 }}>
      <div style={{ background: tone.bg, borderRadius: 18, border: '1px solid rgba(148,163,184,0.18)', padding: 20, boxShadow: '0 12px 30px rgba(15,23,42,0.06)' }}>
        <p style={{ margin: '0 0 6px', fontSize: '0.76rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: tone.accent }}>
          Profile Overview
        </p>
        <h3 style={{ margin: '0 0 8px', color: '#10233d', fontSize: '1.1rem' }}>{user?.full_name}</h3>
        <p style={{ margin: '0 0 18px', color: '#516377', fontSize: '0.9rem' }}>
          {user?.email} · {roleLabel}
        </p>
        <div style={{ display: 'grid', gap: 12 }}>
          {overviewItems.map((item) => (
            <div key={item.label} style={{ background: 'rgba(255,255,255,0.82)', borderRadius: 14, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.6)' }}>
              <div style={{ color: '#64748b', fontSize: '0.78rem', marginBottom: 4 }}>{item.label}</div>
              <div style={{ color: '#10233d', fontWeight: 700, fontSize: '0.9rem' }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dash-form" style={{ margin: 0 }}>
        <h3 style={{ marginBottom: 6 }}>Profile Actions</h3>
        <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.9rem' }}>
          Quick links for the things members actually need to do from their profile.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {actionItems.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: 14,
                textAlign: 'left',
                borderRadius: 16,
                border: '1px solid #dbe7f3',
                background: '#f8fbff',
                cursor: 'pointer',
                transition: 'transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease',
                boxShadow: '0 8px 18px rgba(15,23,42,0.04)',
              }}
            >
              <span style={{ color: tone.accent, marginTop: 1 }}>{item.icon}</span>
              <span>
                <span style={{ display: 'block', color: '#10233d', fontWeight: 700, fontSize: '0.9rem', marginBottom: 4 }}>{item.label}</span>
                <span style={{ display: 'block', color: '#64748b', fontSize: '0.78rem', lineHeight: 1.45 }}>{item.note}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileExperience;
