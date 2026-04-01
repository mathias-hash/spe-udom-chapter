import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Toast from '../components/Toast';
import { api } from '../utils/api';
import Leadership from '../pages/Leadership';
import ChatHistory from '../pages/ChatHistory';

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
          <thead><tr><th>Title</th><th>Message</th><th>Date</th></tr></thead>
          <tbody>{list.map(a => <tr key={a.id}><td>{a.title}</td><td>{a.message.substring(0, 80)}...</td><td>{new Date(a.created_at).toLocaleDateString()}</td></tr>)}</tbody>
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
      <Route path="/chat-history" element={<ChatHistory />} />
      <Route path="/reports" element={<Reports />} />
    </Routes>
  </DashboardLayout>
);

export default PresidentDashboard;
