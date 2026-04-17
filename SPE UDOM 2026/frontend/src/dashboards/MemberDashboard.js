import React, { useEffect, useState } from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProfileExperience from './components/ProfileExperience';
import AnnualReportPage from './components/AnnualReportPage';
import Toast from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import Leadership from '../pages/Leadership';
import Contact from '../pages/Contact';

const extractList = (data) => Array.isArray(data) ? data : (data?.results || []);

const MemberOverview = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  useEffect(() => {
    api('/events/').then(r => setEvents(extractList(r.data)));
    api('/announcements/').then(r => setAnnouncements(extractList(r.data).slice(0, 3)));
  }, []);
  return (
    <>
      <h2 style={{ marginBottom: 20, color: '#333' }}>Welcome, {user?.full_name}</h2>
      <p style={{ color: '#64748b', marginBottom: 18, maxWidth: 760, lineHeight: 1.7 }}>
        Here is your member overview, where you can quickly follow chapter updates, track your activity,
        and move smoothly to events, voting, publications, and support whenever you need them.
      </p>
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-value">{events.length}</div><div className="stat-label">Available Events</div></div>
        <div className="stat-card"><div className="stat-value">{events.filter(e => e.is_registered).length}</div><div className="stat-label">My Registrations</div></div>
        <div className="stat-card"><div className="stat-value">{announcements.length}</div><div className="stat-label">Announcements</div></div>
      </div>
      <div className="dash-table-wrap" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 10 }}>Annual Report</h3>
        <p style={{ color: '#64748b', marginBottom: 14 }}>Read the current annual report and download a copy from your dashboard.</p>
        <Link className="btn btn-primary btn-sm" to="/dashboard/annual-report">View Annual Report</Link>
      </div>
      <div className="dash-table-wrap">
        <h3>Latest Announcements</h3>
        {announcements.length === 0 && <p style={{ color: '#888', padding: '10px 0' }}>No announcements yet.</p>}
        {announcements.map(a => (
          <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
            <strong>{a.title}</strong>
            <p style={{ color: '#555', fontSize: '0.9rem', marginTop: 4 }}>{a.message}</p>
            <small style={{ color: '#999' }}>{new Date(a.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </>
  );
};

const Events = () => {
  const [events, setEvents] = useState([]);
  const [toast, setToast] = useState(null);
  useEffect(() => { api('/events/').then(r => setEvents(extractList(r.data))); }, []);

  const toggle = async (ev) => {
    const method = ev.is_registered ? 'DELETE' : 'POST';
    const { ok } = await api(`/events/${ev.id}/register/`, { method });
    if (ok) {
      setEvents(events.map(e => e.id === ev.id ? { ...e, is_registered: !e.is_registered, registration_count: e.registration_count + (ev.is_registered ? -1 : 1) } : e));
      setToast({ message: ev.is_registered ? 'Unregistered from event.' : 'Successfully registered for event!', type: 'success' });
    } else setToast({ message: 'Action failed. Try again.', type: 'error' });
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="dash-table-wrap">
        <h3>Available Events</h3>
        <table>
          <thead><tr><th>Title</th><th>Date</th><th>Location</th><th>Registered</th><th>Action</th></tr></thead>
          <tbody>
            {events.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No events available</td></tr>}
            {events.map(ev => (
              <tr key={ev.id}>
                <td>{ev.title}</td><td>{new Date(ev.date).toLocaleDateString()}</td>
                <td>{ev.location}</td><td>{ev.registration_count}</td>
                <td>
                  <button className={`btn btn-sm ${ev.is_registered ? 'btn-danger' : 'btn-success'}`} onClick={() => toggle(ev)}>
                    {ev.is_registered ? 'Unregister' : 'Register'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const MyEvents = () => {
  const [events, setEvents] = useState([]);
  useEffect(() => { api('/events/').then(r => setEvents(extractList(r.data).filter(e => e.is_registered))); }, []);
  return (
    <div className="dash-table-wrap">
      <h3>My Registered Events</h3>
      <table>
        <thead><tr><th>Title</th><th>Date</th><th>Location</th></tr></thead>
        <tbody>
          {events.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>No registrations yet</td></tr>}
          {events.map(ev => <tr key={ev.id}><td>{ev.title}</td><td>{new Date(ev.date).toLocaleDateString()}</td><td>{ev.location}</td></tr>)}
        </tbody>
      </table>
    </div>
  );
};

const Publications = () => {
  const [list, setList] = useState([]);
  useEffect(() => { api('/publications/').then(r => setList(extractList(r.data))); }, []);

  const resolveUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${window.location.origin.replace(':3000', ':8000')}${url}`;
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
      <table>
        <thead><tr><th>Title</th><th>Type</th><th>Description</th><th>Date</th><th>Actions</th></tr></thead>
        <tbody>
          {list.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No publications yet</td></tr>}
          {list.map(p => (
            <tr key={p.id}>
              <td><strong>{p.title}</strong></td>
              <td><span className="badge badge-member">{p.pub_type || 'article'}</span></td>
              <td style={{ fontSize: '0.82rem', color: '#555' }}>{p.content?.substring(0, 60)}...</td>
              <td>{new Date(p.created_at).toLocaleDateString()}</td>
              <td>
                {p.file_url
                  ? <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-sm" style={{ background: '#0066cc', color: '#fff' }} onClick={() => openFile(p.file_url)}>Open</button>
                      <button className="btn btn-sm" style={{ background: '#198754', color: '#fff' }} onClick={() => downloadFile(p.file_url, p.title)}>Download</button>
                    </div>
                  : <span style={{ color: '#aaa', fontSize: '0.8rem' }}>—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const ElectionsVote = () => {
  const [elections, setElections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [voted, setVoted] = useState({});
  const [toast, setToast] = useState(null);
  useEffect(() => { api('/elections/').then(r => setElections(extractList(r.data))); }, []);

  const loadVoted = async (el) => {
    const { ok, data } = await api(`/elections/${el.id}/my-votes/`);
    if (ok) {
      const map = {};
      (data.voted_positions || []).forEach(p => { map[p] = true; });
      setVoted(map);
    }
    setSelected(el);
  };

  const vote = async (electionId, candidateId, position) => {
    const { ok } = await api(`/elections/${electionId}/vote/`, { method: 'POST', body: JSON.stringify({ candidate_id: candidateId }) });
    if (ok) {
      setVoted(prev => ({ ...prev, [position]: candidateId }));
      setToast({ message: 'Vote cast successfully! ✓', type: 'success' });
    } else setToast({ message: 'Failed to cast vote. You may have already voted.', type: 'error' });
  };

  // Group candidates by position
  const groupByPosition = (candidates) => {
    const groups = {};
    (candidates || []).filter(c => c.approved).forEach(c => {
      if (!groups[c.position]) groups[c.position] = [];
      groups[c.position].push(c);
    });
    return groups;
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Elections list */}
      <div className="dash-table-wrap" style={{ marginBottom: 20 }}>
        <h3>Elections</h3>
        <table>
          <thead><tr><th>Title</th><th>Status</th><th>Start</th><th>End</th><th>Action</th></tr></thead>
          <tbody>
            {elections.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888' }}>No elections available</td></tr>}
            {elections.map(el => (
              <tr key={el.id}>
                <td><strong>{el.title}</strong></td>
                <td><span className={`badge ${el.status === 'open' ? 'badge-approved' : el.status === 'closed' ? 'badge-rejected' : 'badge-pending'}`}>{el.status}</span></td>
                <td>{new Date(el.start_date).toLocaleDateString()}</td>
                <td>{new Date(el.end_date).toLocaleDateString()}</td>
                <td>
                  {el.status === 'open' && <button className="btn btn-primary btn-sm" onClick={() => loadVoted(el)}>Vote</button>}
                  {el.status === 'closed' && <button className="btn btn-sm" style={{ background: '#6c757d', color: '#fff' }} onClick={() => loadVoted(el)}>Results</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Voting table grouped by position */}
      {selected && (() => {
        const groups = groupByPosition(selected.candidates);
        const isOpen = selected.status === 'open';
        return (
          <div className="dash-table-wrap">
            <h3 style={{ marginBottom: 4 }}>{isOpen ? `🗳 Vote: ${selected.title}` : `📊 Results: ${selected.title}`}</h3>
            <p style={{ color: '#888', fontSize: '0.82rem', marginBottom: 16 }}>
              {isOpen ? 'Select one candidate per position and click Vote.' : 'Final results for this election.'}
            </p>

            {Object.keys(groups).length === 0 && (
              <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>No approved candidates yet.</p>
            )}

            {Object.entries(groups).map(([position, candidates]) => (
              <div key={position} style={{ marginBottom: 28 }}>
                {/* Position header */}
                <div style={{ background: '#0055b3', color: '#fff', padding: '8px 14px', borderRadius: '8px 8px 0 0', fontWeight: 700, fontSize: '0.88rem', letterSpacing: 1, textTransform: 'uppercase' }}>
                  {position}
                </div>

                {/* Candidates table */}
                <table style={{ borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>Photo</th>
                      <th>Name</th>
                      <th>Manifesto</th>
                      {isOpen && <th style={{ width: 80 }}>Vote</th>}
                      {!isOpen && <th style={{ width: 100 }}>Votes</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map(c => (
                      <tr key={c.id} style={{ background: voted[position] === c.id ? '#f0fff4' : '' }}>
                        {/* Photo box */}
                        <td>
                          <div style={{
                            width: 48, height: 48, borderRadius: 6, overflow: 'hidden',
                            background: '#e8f0fe', border: '1.5px solid #c0d4f5',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            {c.photo_url
                              ? <img src={c.photo_url} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0055b3' }}>{c.name?.charAt(0)}</span>
                            }
                          </div>
                        </td>

                        {/* Name */}
                        <td><strong>{c.name}</strong></td>

                        {/* Manifesto */}
                        <td style={{ color: '#555', fontSize: '0.82rem' }}>{c.manifesto || '—'}</td>

                        {/* Vote / Result */}
                        {isOpen && (
                          <td>
                            {voted[position] === c.id
                              ? <span style={{ color: '#198754', fontWeight: 700, fontSize: '0.82rem' }}>✓ Voted</span>
                              : voted[position]
                                ? <span style={{ color: '#aaa', fontSize: '0.78rem' }}>—</span>
                                : <button className="btn btn-primary btn-sm" onClick={() => vote(selected.id, c.id, position)}>Vote</button>
                            }
                          </td>
                        )}
                        {!isOpen && (
                          <td>
                            <strong style={{ color: '#0055b3' }}>{c.vote_count}</strong>
                            <span style={{ color: '#888', fontSize: '0.78rem', marginLeft: 4 }}>votes</span>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        );
      })()}
    </>
  );
};

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '', year_of_study: user?.year_of_study || '' });
  const [toast, setToast] = useState(null);
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);

  const submit = async e => {
    e.preventDefault();
    const { ok, data } = await api('/auth/profile/', { method: 'PATCH', body: JSON.stringify(form) });
    if (ok) {
      updateUser(data);
      setToast({ message: 'Profile updated successfully!', type: 'success' });
    } else setToast({ message: 'Failed to update profile.', type: 'error' });
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

      <ProfileExperience user={user} roleLabel="Member" accent="blue" />

      {/* Update Profile */}
      <div className="dash-form" id="profile-edit-section" style={{ marginBottom: 24 }}>
        <h3>Update Profile</h3>
        <form onSubmit={submit}>
          <div className="form-group"><label>Email (cannot change)</label><input value={user?.email} disabled style={{ background: '#f5f5f5' }} /></div>
          <div className="form-group"><label>Full Name</label><input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} required /></div>
          <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
          <div className="form-group">
            <label>Year of Study</label>
            <select value={form.year_of_study} onChange={e => setForm({ ...form, year_of_study: e.target.value })}>
              <option value="">Select year</option>
              {[1,2,3,4].map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="submit">Save Changes</button>
        </form>
      </div>

      {/* Change Password */}
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

const Suggestions = () => {
  const [form, setForm] = useState({ message: '' });
  const [mySuggestions, setMySuggestions] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    api('/suggestions/my/').then(r => setMySuggestions(Array.isArray(r.data) ? r.data : []));
  }, []);

  const submit = async e => {
    e.preventDefault();
    const { ok } = await api('/suggestions/', { method: 'POST', body: JSON.stringify(form) });
    if (ok) {
      setForm({ message: '' });
      setToast({ message: 'Your suggestion has been sent successfully.', type: 'success' });
      api('/suggestions/my/').then(r => setMySuggestions(Array.isArray(r.data) ? r.data : []));
    } else setToast({ message: 'Failed to submit suggestion.', type: 'error' });
  };
  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Submit new suggestion */}
      <div className="dash-form" style={{ marginBottom: 24 }}>
        <h3>Share Your Suggestion</h3>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 14 }}>
          We value your ideas. Share a suggestion, improvement, or concern to help us make the chapter better for everyone.
        </p>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Your Suggestion</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              rows={4}
              placeholder="Example: It would be helpful to organize more technical workshops, improve event reminders, or add new member support activities."
              required
            />
          </div>
          <button className="btn btn-primary" type="submit">Send Suggestion</button>
        </form>
      </div>

      {/* My suggestions with replies */}
      {mySuggestions.length > 0 && (
        <div className="dash-table-wrap">
          <h3>My Suggestions & Replies</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {mySuggestions.map(s => (
              <div key={s.id} style={{ background: '#f8faff', borderRadius: 10, padding: 16, border: '1px solid #eef2ff' }}>
                {/* Original message */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.78rem', color: '#888' }}>{new Date(s.created_at).toLocaleString()}</span>
                  {s.is_anonymous && <span style={{ fontSize: '0.72rem', background: '#e2e8f0', color: '#555', padding: '2px 8px', borderRadius: 10 }}>Anonymous</span>}
                </div>
                <p style={{ color: '#1a1a2e', fontSize: '0.92rem', marginBottom: 10 }}>{s.message}</p>

                {/* Admin reply */}
                {s.reply ? (
                  <div style={{ background: '#d1e7dd', borderRadius: 8, padding: '10px 14px', marginBottom: 10, borderLeft: '3px solid #198754' }}>
                    <p style={{ fontSize: '0.78rem', color: '#0a5c36', fontWeight: 700, marginBottom: 4 }}>
                      ✓ Reply from {s.replied_by_name || 'Admin'} &bull; {s.replied_at ? new Date(s.replied_at).toLocaleString() : ''}
                    </p>
                    <p style={{ color: '#1a1a2e', fontSize: '0.88rem', margin: 0 }}>{s.reply}</p>

                    {/* No reply back button - read only */}
                  </div>
                ) : (
                  <span style={{ fontSize: '0.78rem', color: '#aaa', fontStyle: 'italic' }}>No reply yet</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

const MemberDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route path="/" element={<MemberOverview />} />
      <Route path="/events" element={<Events />} />
      <Route path="/my-events" element={<MyEvents />} />
      <Route path="/publications" element={<Publications />} />
      <Route path="/annual-report" element={<AnnualReportPage title="Annual Report" />} />
      <Route path="/leadership" element={<Leadership />} />
      <Route path="/elections" element={<ElectionsVote />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/suggestions" element={<Suggestions />} />
      <Route path="/contact" element={<Contact />} />
    </Routes>
  </DashboardLayout>
);

export default MemberDashboard;
