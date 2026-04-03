import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import AnnualReportPage from './components/AnnualReportPage';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import ElectionAnalytics from '../components/ElectionAnalytics';
import Leadership from '../pages/Leadership';
import { useAuth } from '../context/AuthContext';
import { api, apiList } from '../utils/api';

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-value">{value ?? '...'}</div>
    <div className="stat-label">{label}</div>
  </div>
);

// Overview
const AdminOverview = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/admin-dashboard/').then(r => { setStats(r.data); setLoading(false); }); }, []);
  if (loading) return <Spinner />;
  return (
    <>
      <h2 style={{ marginBottom: 20, color: '#333' }}>Admin Dashboard</h2>
      <div className="stat-grid">
        <StatCard label="Total Members" value={stats.total_members} />
        <StatCard label="Total Events" value={stats.total_events} />
        <StatCard label="Pending Events" value={stats.pending_events} />
        <StatCard label="Publications" value={stats.total_publications} />
        <StatCard label="Elections" value={stats.total_elections} />
      </div>
      <div className="dash-table-wrap" style={{ marginTop: 24 }}>
        <h3 style={{ marginBottom: 10 }}>Annual Report</h3>
        <p style={{ color: '#64748b', marginBottom: 14 }}>Open the annual report to review the published chapter record and download it.</p>
        <Link className="btn btn-primary btn-sm" to="/dashboard/annual-report">Open Annual Report</Link>
      </div>
      <ElectionAnalytics />
    </>
  );
};

const ROLES = [
  { value: 'member', label: 'Member' },
  { value: 'president', label: 'President' },
  { value: 'general_secretary', label: 'General Secretary' },
  { value: 'admin', label: 'Admin' },
];

const roleBadgeColor = { member: '#cfe2ff', president: '#d1e7dd', general_secretary: '#fff3cd', admin: '#f8d7da' };
const roleTextColor = { member: '#084298', president: '#0a5c36', general_secretary: '#856404', admin: '#842029' };

// Manage Users
const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', year_of_study: '', role: 'member', password: '', confirm_password: '' });
  const [formErrors, setFormErrors] = useState({});
  const [formLoading, setFormLoading] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const load = React.useCallback((q = query, p = page) => {
    setLoading(true);
    api(`/users/?search=${q}&page=${p}`).then(r => {
      const d = r.data;
      setUsers(Array.isArray(d) ? d : (d.results || []));
      setTotalPages(d.total_pages || 1);
      setLoading(false);
    });
  }, [query, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleSearch = e => { e.preventDefault(); setPage(1); load(search, 1); };

  const changeRole = async (id, role) => {
    const { ok, data } = await api(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify({ role }) });
    if (ok) { setUsers(users.map(u => u.id === id ? data : u)); setToast({ message: `Role updated to ${role}!`, type: 'success' }); }
    else setToast({ message: 'Failed to update role.', type: 'error' });
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    const { ok } = await api(`/users/${id}/`, { method: 'DELETE' });
    if (ok) { setUsers(users.filter(u => u.id !== id)); setToast({ message: 'User deleted.', type: 'success' }); }
    else setToast({ message: 'Failed to delete user.', type: 'error' });
  };

  const openEdit = (u) => {
    setEditUser(u);
    setForm({ full_name: u.full_name, email: u.email, phone: u.phone || '', year_of_study: u.year_of_study || '', role: u.role, password: '', confirm_password: '' });
    setFormErrors({});
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditUser(null);
    setForm({ full_name: '', email: '', phone: '', year_of_study: '', role: 'member', password: '', confirm_password: '' });
    setFormErrors({});
  };

  const submitForm = async e => {
    e.preventDefault();
    setFormErrors({});
    if (!editUser && form.password !== form.confirm_password) {
      setFormErrors({ confirm_password: 'Passwords do not match' });
      return;
    }
    setFormLoading(true);
    let res;
    if (editUser) {
      // Update existing user
      const payload = { full_name: form.full_name, phone: form.phone, year_of_study: form.year_of_study || null, role: form.role };
      res = await api(`/users/${editUser.id}/`, { method: 'PATCH', body: JSON.stringify(payload) });
      if (res.ok) {
        setUsers(users.map(u => u.id === editUser.id ? res.data : u));
        setToast({ message: 'User updated successfully!', type: 'success' });
        resetForm();
      } else setFormErrors(res.data);
    } else {
      // Create new user
      const payload = { full_name: form.full_name, email: form.email, phone: form.phone, year_of_study: form.year_of_study || null, role: form.role, password: form.password, confirm_password: form.confirm_password };
      res = await api('/users/create/', { method: 'POST', body: JSON.stringify(payload) });
      if (res.ok) {
        setUsers([res.data, ...users]);
        setToast({ message: `User ${res.data.full_name} added successfully!`, type: 'success' });
        resetForm();
      } else setFormErrors(res.data);
    }
    setFormLoading(false);
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Add / Edit User Form */}
      {showForm && (
        <div className="dash-form" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3>{editUser ? `Edit User: ${editUser.full_name}` : 'Add New User'}</h3>
            <button className="btn btn-sm" style={{ background: '#f0f0f0' }} onClick={resetForm}>✕ Cancel</button>
          </div>
          <form onSubmit={submitForm}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Full Name *</label>
                <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Full name" required />
                {formErrors.full_name && <span style={{ color: '#dc3545', fontSize: '0.82rem' }}>{formErrors.full_name}</span>}
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required disabled={!!editUser} style={editUser ? { background: '#f5f5f5' } : {}} />
                {formErrors.email && <span style={{ color: '#dc3545', fontSize: '0.82rem' }}>{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+255 ..." />
              </div>
              <div className="form-group">
                <label>Year of Study</label>
                <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}>
                  <option value="">Select year</option>
                  {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Role & Position *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} required>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              {!editUser && (
                <>
                  <div className="form-group">
                    <label>Password *</label>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" required />
                    {formErrors.password && <span style={{ color: '#dc3545', fontSize: '0.82rem' }}>{formErrors.password}</span>}
                  </div>
                  <div className="form-group">
                    <label>Confirm Password *</label>
                    <input type="password" value={form.confirm_password} onChange={e => setForm({ ...form, confirm_password: e.target.value })} placeholder="Repeat password" required />
                    {formErrors.confirm_password && <span style={{ color: '#dc3545', fontSize: '0.82rem' }}>{formErrors.confirm_password}</span>}
                  </div>
                </>
              )}
            </div>
            {formErrors.non_field_errors && <p style={{ color: '#dc3545', fontSize: '0.85rem', marginTop: 8 }}>{formErrors.non_field_errors}</p>}
            <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={formLoading}>
                {formLoading ? 'Saving...' : editUser ? 'Update User' : 'Add User'}
              </button>
              <button className="btn btn-sm" style={{ background: '#f0f0f0' }} type="button" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="dash-table-wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Manage Users</h3>
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true); }}>+ Add User</button>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email..."
            style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: '1.5px solid #dde3f0', outline: 'none' }} />
          <button className="btn btn-primary btn-sm" type="submit">Search</button>
          {query && <button className="btn btn-sm" style={{ background: '#f0f0f0' }} type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); load('', 1); }}>Clear</button>}
        </form>
        {loading ? <Spinner /> : (
          <>
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Year</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
              <tbody>
                {users.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No users found</td></tr>}
                {users.map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.full_name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || '-'}</td>
                    <td>{u.year_of_study ? `Year ${u.year_of_study}` : '-'}</td>
                    <td>
                      <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                        style={{ padding: '4px 8px', borderRadius: 5, border: '1px solid #ddd', background: roleBadgeColor[u.role], color: roleTextColor[u.role], fontWeight: 600, fontSize: '0.82rem' }}>
                        {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </td>
                    <td>{new Date(u.date_joined).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-sm" style={{ background: '#0066cc', color: '#fff' }} onClick={() => openEdit(u)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => deleteUser(u.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'center' }}>
                <button className="btn btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={`btn btn-sm ${page === p ? 'btn-primary' : ''}`} onClick={() => setPage(p)}>{p}</button>
                ))}
                <button className="btn btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

// Manage Events
const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', location: '', date: '' });
  const [toast, setToast] = useState(null);
  const [cancelModal, setCancelModal] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  useEffect(() => { apiList('/events/').then(d => { setEvents(d); setLoading(false); }); }, []);

  const submit = async e => {
    e.preventDefault();
    const { ok, data } = await api('/events/', { method: 'POST', body: JSON.stringify(form) });
    if (ok) { setEvents([data, ...events]); setForm({ title: '', description: '', location: '', date: '' }); setToast({ message: 'Event created!', type: 'success' }); }
    else setToast({ message: 'Failed to create event.', type: 'error' });
  };

  const approve = async (id, status) => {
    const { ok, data } = await api(`/events/${id}/approve/`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (ok) { setEvents(events.map(e => e.id === id ? data : e)); setToast({ message: `Event ${status}!`, type: 'success' }); }
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) { setToast({ message: 'Please provide a cancellation reason.', type: 'error' }); return; }
    const { ok, data } = await api(`/events/${cancelModal}/approve/`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', cancel_reason: cancelReason }) });
    if (ok) {
      setEvents(events.map(e => e.id === cancelModal ? data : e));
      setToast({ message: 'Event cancelled.', type: 'success' });
      setCancelModal(null); setCancelReason('');
    } else setToast({ message: 'Failed to cancel event.', type: 'error' });
  };

  const deleteEvent = async (id) => {
    if (!window.confirm('Permanently delete this event?')) return;
    const { ok } = await api(`/events/${id}/delete/`, { method: 'DELETE' });
    if (ok) { setEvents(events.filter(e => e.id !== id)); setToast({ message: 'Event deleted.', type: 'success' }); }
    else setToast({ message: 'Failed to delete event.', type: 'error' });
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {cancelModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: 10, color: '#333' }}>Cancel Event</h3>
            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: 10 }}>Reason for cancellation:</p>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} rows={3}
              placeholder="Enter reason..." style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm" style={{ background: '#fd7e14', color: '#fff' }} onClick={submitCancel}>Confirm Cancel</button>
              <button className="btn btn-sm" style={{ background: '#f0f0f0' }} onClick={() => { setCancelModal(null); setCancelReason(''); }}>Back</button>
            </div>
          </div>
        </div>
      )}

      <div className="dash-form" style={{ marginBottom: 24 }}>
        <h3>Create Event</h3>
        <form onSubmit={submit}>
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} required /></div>
          <div className="form-group"><label>Location</label><input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required /></div>
          <div className="form-group"><label>Date</label><input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required /></div>
          <button className="btn btn-primary" type="submit">Create Event</button>
        </form>
      </div>

      <div className="dash-table-wrap">
        <h3>All Events</h3>
        {loading ? <Spinner /> : (
          <table>
            <thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Status</th><th>Cancel Reason</th><th>Reg.</th><th>Actions</th></tr></thead>
            <tbody>
              {events.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No events yet</td></tr>}
              {events.map(ev => (
                <tr key={ev.id}>
                  <td>{ev.title}</td>
                  <td>{new Date(ev.date).toLocaleDateString()}</td>
                  <td>{ev.location}</td>
                  <td><span className={`badge badge-${ev.status}`}>{ev.status}</span></td>
                  <td style={{ fontSize: '0.8rem', color: '#666' }}>{ev.cancel_reason || '-'}</td>
                  <td>{ev.registration_count}</td>
                  <td style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {ev.status === 'pending' && <>
                      <button className="btn btn-success btn-sm" onClick={() => approve(ev.id, 'approved')}>Approve</button>
                      <button className="btn btn-danger btn-sm" onClick={() => approve(ev.id, 'rejected')}>Reject</button>
                    </>}
                    {ev.status !== 'cancelled' && (
                      <button className="btn btn-sm" style={{ background: '#fd7e14', color: '#fff' }} onClick={() => setCancelModal(ev.id)}>Cancel</button>
                    )}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteEvent(ev.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

// Announcements
const Announcements = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', message: '' });
  const [toast, setToast] = useState(null);
  useEffect(() => { apiList('/announcements/').then(d => { setList(d); setLoading(false); }); }, []);

  const submit = async e => {
    e.preventDefault();
    const { ok, data } = await api('/announcements/', { method: 'POST', body: JSON.stringify(form) });
    if (ok) { setList([data, ...list]); setForm({ title: '', message: '' }); setToast({ message: 'Announcement sent!', type: 'success' }); }
    else setToast({ message: 'Failed to send.', type: 'error' });
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="dash-form" style={{ marginBottom: 24 }}>
        <h3>Send Announcement</h3>
        <form onSubmit={submit}>
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="form-group"><label>Message</label><textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4} required /></div>
          <button className="btn btn-primary" type="submit">Send</button>
        </form>
      </div>
      <div className="dash-table-wrap">
        <h3>Announcements</h3>
        {loading ? <Spinner /> : (
          <table>
            <thead><tr><th>Title</th><th>Message</th><th>Sent By</th><th>Date</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No announcements yet</td></tr>}
              {list.map(a => (
                <tr key={a.id}>
                  <td>{a.title}</td><td>{a.message.substring(0, 60)}...</td>
                  <td>{a.sent_by_name}</td><td>{new Date(a.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
};

// Suggestions
const Suggestions = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyTarget, setReplyTarget] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [toast, setToast] = useState(null);
  useEffect(() => { apiList('/suggestions/').then(d => { setList(d); setLoading(false); }); }, []);

  const openReply = (suggestion) => {
    if (!suggestion.student_email) {
      setToast({ message: 'No email available for this suggestion.', type: 'error' });
      return;
    }
    setReplyTarget(suggestion);
    setReplyMessage(
      `Hi ${suggestion.student_name},\n\nThanks for your suggestion:\n"${suggestion.message}"\n\n`
    );
  };

  const closeReply = () => {
    setReplyTarget(null);
    setReplyMessage('');
  };

  const sendReply = () => {
    if (!replyTarget) return;
    const subject = 'SPE UDOM Chapter Reply';
    const body = replyMessage.trim() || `Hi ${replyTarget.student_name},\n\nThank you for your suggestion.\n\nSPE UDOM Team`;
    const mailto = `mailto:${replyTarget.student_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailto, '_blank');
    setToast({ message: 'Opening your email client...', type: 'success' });
    closeReply();
  };
  return (
    <div className="dash-table-wrap">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <h3>Member Suggestions & Feedback</h3>
      {replyTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: 8, color: '#333' }}>Reply to {replyTarget.student_name}</h3>
            <p style={{ fontSize: '0.88rem', color: '#666', marginBottom: 10 }}>Message</p>
            <textarea
              value={replyMessage}
              onChange={e => setReplyMessage(e.target.value)}
              rows={6}
              placeholder="Write your reply..."
              style={{ width: '100%', border: '1.5px solid #ddd', borderRadius: 8, padding: '8px 10px', fontSize: '0.88rem', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button className="btn btn-sm" style={{ background: '#0066cc', color: '#fff' }} onClick={sendReply}>Send Reply</button>
              <button className="btn btn-sm" style={{ background: '#f0f0f0' }} onClick={closeReply}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      {loading ? <Spinner /> : (
        <table>
          <thead><tr><th>From</th><th>Message</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>No suggestions yet</td></tr>}
            {list.map(s => (
              <tr key={s.id}>
                <td>{s.student_name}</td>
                <td>{s.message}</td>
                <td>{new Date(s.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    className="btn btn-sm"
                    style={{ background: s.student_email ? '#0066cc' : '#cbd5e1', color: '#fff' }}
                    onClick={() => openReply(s)}
                    disabled={!s.student_email}
                  >
                    Reply
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

// Publications (read-only with Open + Download)
const AdminPublications = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { apiList('/publications/').then(d => { setList(d); setLoading(false); }); }, []);

  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${window.location.origin.replace(':3000', ':8000')}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const openFile = (url) => window.open(resolveUrl(url), '_blank', 'noopener,noreferrer');

  const downloadFile = async (url, title) => {
    try {
      const res = await fetch(resolveUrl(url));
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = title || 'publication';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {}
  };

  return (
    <div className="dash-table-wrap">
      <h3>Publications</h3>
      {loading ? <Spinner /> : (
        <table>
          <thead><tr><th>Title</th><th>Type</th><th>Published By</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {list.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No publications yet</td></tr>}
            {list.map(p => (
              <tr key={p.id}>
                <td><strong>{p.title}</strong></td>
                <td><span className="badge badge-member">{p.pub_type || 'article'}</span></td>
                <td>{p.published_by_name}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                  {p.file_url
                    ? <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm" style={{ background: '#0066cc', color: '#fff' }} onClick={() => openFile(p.file_url)}>Open</button>
                        <button className="btn btn-sm" style={{ background: '#198754', color: '#fff' }} onClick={() => downloadFile(p.file_url, p.title)}>Download</button>
                      </div>
                    : <span style={{ color: '#aaa', fontSize: '0.8rem' }}>No file</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', year_of_study: user?.year_of_study || '' });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  const updateProfile = async e => {
    e.preventDefault();
    setLoading(true);
    const { ok, data } = await api('/auth/profile/', { method: 'PATCH', body: JSON.stringify(form) });
    if (ok) {
      updateUser(data);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } else setToast({ message: 'Failed to update profile.', type: 'error' });
    setLoading(false);
  };

  const changePassword = async e => {
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

      {/* Profile Info Card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, background: '#fff', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #eef2ff' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0066cc,#0099ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.8rem', fontWeight: 800, flexShrink: 0 }}>
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 style={{ color: '#1a1a2e', marginBottom: 4 }}>{user?.full_name}</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>{user?.email}</p>
          <span style={{ background: '#f8d7da', color: '#842029', padding: '2px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>ADMIN</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* Update Info */}
        <div className="dash-form">
          <h3>Update Information</h3>
          <form onSubmit={updateProfile}>
            <div className="form-group"><label>Email (cannot change)</label><input value={user?.email} disabled style={{ background: '#f5f5f5' }} /></div>
            <div className="form-group"><label>Full Name</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></div>
            <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+255 ..." /></div>
            <div className="form-group">
              <label>Year of Study</label>
              <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}>
                <option value="">Select year</option>
                {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
          </form>
        </div>

        {/* Account Info */}
        <div className="dash-form">
          <h3>Account Details</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'Role', value: 'Administrator' },
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

      {/* Change Password */}
      <div className="dash-form" style={{ maxWidth: '100%' }}>
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

const AdminDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route path="/" element={<AdminOverview />} />
      <Route path="/users" element={<ManageUsers />} />
      <Route path="/events" element={<ManageEvents />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/suggestions" element={<Suggestions />} />
      <Route path="/publications" element={<AdminPublications />} />
      <Route path="/analytics" element={<ElectionAnalytics />} />
      <Route path="/leadership" element={<Leadership />} />
      <Route path="/annual-report" element={<AnnualReportPage title="Annual Report" />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </DashboardLayout>
);

export default AdminDashboard;
