import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProfileExperience from './components/ProfileExperience';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Leadership from '../pages/Leadership';
import Contact from '../pages/Contact';

const StatCard = ({ label, value }) => (
  <div className="stat-card"><div className="stat-value">{value ?? '...'}</div><div className="stat-label">{label}</div></div>
);

const extractList = (data) => Array.isArray(data) ? data : (data?.results || []);

const PresidentOverview = () => {
  const [stats, setStats] = useState({});
  useEffect(() => { api('/president-dashboard/').then(r => setStats(r.data)); }, []);
  return (
    <>
      <h2 style={{ marginBottom: 20, color: '#333' }}>President Dashboard</h2>
      <p style={{ color: '#64748b', marginBottom: 18, maxWidth: 800, lineHeight: 1.7 }}>
        This overview helps you stay aligned with membership growth, chapter activity, approvals,
        and communication so you can guide the chapter with clear and timely decisions.
      </p>
      <div className="stat-grid">
        <StatCard label="Total Members" value={stats.total_members} />
        <StatCard label="Approved Events" value={stats.approved_events} />
        <StatCard label="Pending Approvals" value={stats.pending_events} />
        <StatCard label="Announcements" value={stats.announcements} />
        <StatCard label="Suggestions" value={stats.suggestions} />
        <StatCard label="Participations" value={stats.participation} />
      </div>
    </>
  );
};

const Members = () => {
  const [users, setUsers] = useState([]);
  useEffect(() => { api('/users/').then(r => setUsers(extractList(r.data))); }, []);
  return (
    <div className="dash-table-wrap">
      <h3>Members ({users.length})</h3>
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Year</th><th>Joined</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.full_name}</td><td>{u.email}</td>
              <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
              <td>{u.year_of_study || '-'}</td>
              <td>{new Date(u.date_joined).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const Approvals = () => {
  const [events, setEvents] = useState([]);
  const [toast, setToast] = useState(null);
  useEffect(() => { api('/events/').then(r => setEvents(extractList(r.data).filter(e => e.status === 'pending'))); }, []);

  const approve = async (id, status) => {
    const { ok } = await api(`/events/${id}/approve/`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (ok) {
      setEvents(events.filter(e => e.id !== id));
      setToast({ message: `Event ${status} successfully!`, type: 'success' });
    } else setToast({ message: 'Action failed. Try again.', type: 'error' });
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="dash-table-wrap">
        <h3>Pending Event Approvals ({events.length})</h3>
        <table>
          <thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Created By</th><th>Actions</th></tr></thead>
          <tbody>
            {events.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No pending approvals</td></tr>}
            {events.map(ev => (
              <tr key={ev.id}>
                <td>{ev.title}</td><td>{new Date(ev.date).toLocaleDateString()}</td>
                <td>{ev.location}</td><td>{ev.created_by_name}</td>
                <td style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-success btn-sm" onClick={() => approve(ev.id, 'approved')}>Approve</button>
                  <button className="btn btn-danger btn-sm" onClick={() => approve(ev.id, 'rejected')}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const Announcements = () => {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: '', message: '' });
  const [toast, setToast] = useState(null);
  useEffect(() => { api('/announcements/').then(r => setList(extractList(r.data))); }, []);

  const submit = async e => {
    e.preventDefault();
    const { ok, data } = await api('/announcements/', { method: 'POST', body: JSON.stringify(form) });
    if (ok) {
      setList([data, ...list]);
      setForm({ title: '', message: '' });
      setToast({ message: 'Announcement broadcast successfully!', type: 'success' });
    } else setToast({ message: 'Failed to send announcement.', type: 'error' });
  };

  const deleteAnnouncement = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      const { ok } = await api(`/announcements/${id}/`, { method: 'DELETE' });
      if (ok) {
        setList(list.filter(a => a.id !== id));
        setToast({ message: 'Announcement deleted successfully!', type: 'success' });
      } else {
        setToast({ message: 'Failed to delete announcement.', type: 'error' });
      }
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="dash-form" style={{ marginBottom: 24 }}>
        <h3>Broadcast Announcement</h3>
        <form onSubmit={submit}>
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="form-group"><label>Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} required /></div>
          <button className="btn btn-primary" type="submit">Broadcast</button>
        </form>
      </div>
      <div className="dash-table-wrap">
        <h3>Sent Announcements</h3>
        <table>
          <thead><tr><th>Title</th><th>Message</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No announcements yet</td></tr>}
            {list.map(a => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.message.substring(0, 80)}...</td>
                <td>{new Date(a.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteAnnouncement(a.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const Reports = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => { api('/events/').then(r => setEvents(extractList(r.data))); }, []);
  const total = events.length;
  const approved = events.filter(e => e.status === 'approved').length;
  const totalReg = events.reduce((s, e) => s + e.registration_count, 0);
  return (
    <>
      <h2 style={{ marginBottom: 20, color: '#333' }}>Reports & Analytics</h2>
      <div className="stat-grid">
        <StatCard label="Total Events" value={total} />
        <StatCard label="Approved Events" value={approved} />
        <StatCard label="Total Participations" value={totalReg} />
      </div>
      <div className="dash-table-wrap">
        <h3>Event Participation</h3>
        <table>
          <thead><tr><th>Event</th><th>Date</th><th>Status</th><th>Registrations</th></tr></thead>
          <tbody>{events.map(e => <tr key={e.id}><td>{e.title}</td><td>{new Date(e.date).toLocaleDateString()}</td><td><span className={`badge badge-${e.status}`}>{e.status}</span></td><td>{e.registration_count}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
};

const Suggestions = () => {
  const [list, setList] = useState([]);
  useEffect(() => { api('/suggestions/').then(r => setList(extractList(r.data))); }, []);
  return (
    <div className="dash-table-wrap">
      <h3>Member Suggestions</h3>
      <table>
        <thead><tr><th>From</th><th>Message</th><th>Date</th></tr></thead>
        <tbody>{list.map(s => <tr key={s.id}><td>{s.student_name}</td><td>{s.message}</td><td>{new Date(s.created_at).toLocaleDateString()}</td></tr>)}</tbody>
      </table>
    </div>
  );
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', year_of_study: user?.year_of_study || '' });
  const [toast, setToast] = useState(null);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const { ok, data } = await api('/auth/profile/', { method: 'PATCH', body: JSON.stringify(form) });
    if (ok) {
      updateUser(data);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } else {
      setToast({ message: 'Failed to update profile.', type: 'error' });
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwErrors({});
    setPwLoading(true);
    const { ok, data } = await api('/auth/change-password/', { method: 'POST', body: JSON.stringify(pwForm) });
    if (ok) {
      setToast({ message: data.message, type: 'success' });
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } else {
      setPwErrors(data);
      setToast({ message: 'Failed to change password.', type: 'error' });
    }
    setPwLoading(false);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h2 style={{ marginBottom: 24, color: '#333' }}>My Profile</h2>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #eef2ff' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.8rem', fontWeight: 800, flexShrink: 0 }}>
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 style={{ color: '#1a1a2e', marginBottom: 4 }}>{user?.full_name}</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>{user?.email}</p>
          <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>PRESIDENT</span>
        </div>
      </div>

      <ProfileExperience user={user} roleLabel="President" accent="violet" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        <div className="dash-form" id="profile-edit-section">
          <h3>Update Information</h3>
          <form onSubmit={submit}>
            <div className="form-group"><label>Email (cannot change)</label><input value={user?.email || ''} disabled style={{ background: '#f5f5f5' }} /></div>
            <div className="form-group"><label>Full Name</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+255 ..." /></div>
            <div className="form-group">
              <label>Year of Study</label>
              <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}>
                <option value="">Select year</option>
                {[1, 2, 3, 4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Save Changes</button>
          </form>
        </div>

        <div className="dash-form">
          <h3>Account Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Role', value: 'President' },
              { label: 'Email', value: user?.email },
              { label: 'Phone', value: user?.phone || 'Not set' },
              { label: 'Year of Study', value: user?.year_of_study ? `Year ${user.year_of_study}` : 'Not set' },
              { label: 'Member Since', value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '-' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: '#888', fontSize: '0.88rem' }}>{item.label}</span>
                <span style={{ color: '#1a1a2e', fontWeight: 600, fontSize: '0.88rem' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dash-form" id="profile-security-section" style={{ maxWidth: '100%' }}>
        <h3>Change Password</h3>
        <form onSubmit={changePassword}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Current Password</label>
              <input type="password" value={pwForm.current_password} onChange={e => setPwForm({ ...pwForm, current_password: e.target.value })} placeholder="Current password" required />
              {pwErrors.current_password && <span style={{ color: '#dc3545', fontSize: '0.82rem' }}>{pwErrors.current_password}</span>}
            </div>
            <div className="form-group">
              <label>New Password</label>
              <input type="password" value={pwForm.new_password} onChange={e => setPwForm({ ...pwForm, new_password: e.target.value })} placeholder="Min 6 characters" required />
              {pwErrors.new_password && <span style={{ color: '#dc3545', fontSize: '0.82rem' }}>{pwErrors.new_password}</span>}
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <input type="password" value={pwForm.confirm_password} onChange={e => setPwForm({ ...pwForm, confirm_password: e.target.value })} placeholder="Repeat new password" required />
              {pwErrors.confirm_password && <span style={{ color: '#dc3545', fontSize: '0.82rem' }}>{pwErrors.confirm_password}</span>}
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={pwLoading} style={{ marginTop: 8 }}>
            {pwLoading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </>
  );
};

const PresidentDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route path="/" element={<PresidentOverview />} />
      <Route path="/members" element={<Members />} />
      <Route path="/events" element={<Reports />} />
      <Route path="/approvals" element={<Approvals />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/suggestions" element={<Suggestions />} />
      <Route path="/leadership" element={<Leadership />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  </DashboardLayout>
);

export default PresidentDashboard;
