import React, { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import DashboardLayout from './components/DashboardLayout';
import ProfileExperience from './components/ProfileExperience';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import ElectionAnalytics from '../components/ElectionAnalytics';
import { useAuth } from '../context/AuthContext';
import { api, apiList, API_BASE } from '../utils/api';

// ── Shared Confirm Modal ──────────────────────────────────────
const ConfirmModal = ({ title, message, onConfirm, onCancel }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
    <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: 380, boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <span style={{ background: '#fef2f2', borderRadius: 10, padding: 10, display: 'flex' }}>
          <FiAlertTriangle size={22} color="#dc2626" />
        </span>
        <h3 style={{ margin: 0, color: '#1a1a2e', fontSize: '1rem' }}>{title}</h3>
      </div>
      <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: 22 }}>{message}</p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '9px 20px', borderRadius: 8, border: '1.5px solid #dde3f0', background: '#fff', color: '#555', fontWeight: 600, cursor: 'pointer', fontSize: '0.88rem' }}>Cancel</button>
        <button onClick={onConfirm} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#dc2626', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <FiTrash2 size={14} /> Delete
        </button>
      </div>
    </div>
  </div>
);

const StatCard = ({ label, value }) => (
  <div className="stat-card"><div className="stat-value">{value ?? '...'}</div><div className="stat-label">{label}</div></div>
);

const POSITIONS = [
  'PRESIDENT','VICE PRESIDENT','GENERAL SECRETARY','TREASURER',
  'MEMBERSHIP CHAIR PERSON','PROGRAM CHAIR PERSON',
  'COMMUNICATIONS AND OUTREACH CHAIRPERSON','SOCIAL ACTIVITIES CHAIRPERSON',
  'WEB MASTER','TECHNICAL OFFICER','FACULTY ADVISOR',
];

// ── Overview ──────────────────────────────────────────────────
const SecretaryOverview = () => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => { api('/secretary-dashboard/').then(r => { setStats(r.data); setLoading(false); }); }, []);
  if (loading) return <Spinner />;
  return (
    <>
      <h2 style={{ marginBottom: 20, color: '#333' }}>General Secretary Dashboard</h2>
      <div className="stat-grid">
        <StatCard label="Total Elections" value={stats.total_elections} />
        <StatCard label="Open Elections" value={stats.open_elections} />
        <StatCard label="Pending Candidates" value={stats.pending_candidates} />
        <StatCard label="Publications" value={stats.total_publications} />
        <StatCard label="Total Votes" value={stats.total_votes} />
      </div>
      <ElectionAnalytics />
    </>
  );
};

// ── Elections ─────────────────────────────────────────────────
const Elections = () => {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', start_date: '', end_date: '', status: 'draft' });
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { apiList('/elections/').then(d => { setElections(d); setLoading(false); }); }, []);

  const submit = async e => {
    e.preventDefault();
    const { ok, data } = await api('/elections/', { method: 'POST', body: JSON.stringify(form) });
    if (ok) {
      setElections([data, ...elections]);
      setForm({ title: '', description: '', start_date: '', end_date: '', status: 'draft' });
      setShowForm(false);
      setToast({ message: 'Election created successfully!', type: 'success' });
    } else setToast({ message: 'Failed to create election.', type: 'error' });
  };

  const changeStatus = async (id, status) => {
    const { ok, data } = await api(`/elections/${id}/`, { method: 'PATCH', body: JSON.stringify({ status }) });
    if (ok) {
      setElections(elections.map(e => e.id === id ? data : e));
      setToast({ message: `Election ${status === 'open' ? 'opened' : 'closed'}!`, type: 'success' });
    }
  };

  const deleteElection = async (id) => {
    if (!window.confirm('Delete this election?')) return;
    const { ok } = await api(`/elections/${id}/`, { method: 'DELETE' });
    if (ok) { setElections(elections.filter(e => e.id !== id)); setToast({ message: 'Election deleted.', type: 'success' }); }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#333' }}>Manage Elections</h2>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Election'}
        </button>
      </div>

      {showForm && (
        <div className="dash-form" style={{ marginBottom: 24 }}>
          <h3>Create New Election</h3>
          <form onSubmit={submit}>
            <div className="form-group"><label>Title *</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="form-group"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group"><label>Start Date *</label><input type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} required /></div>
              <div className="form-group"><label>End Date *</label><input type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} required /></div>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit">Create Election</button>
          </form>
        </div>
      )}

      <div className="dash-table-wrap">
        <h3>All Elections</h3>
        {loading ? <Spinner /> : (
          <table>
            <thead><tr><th>Title</th><th>Start</th><th>End</th><th>Status</th><th>Candidates</th><th>Votes</th><th>Actions</th></tr></thead>
            <tbody>
              {elections.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>No elections yet</td></tr>}
              {elections.map(el => (
                <tr key={el.id}>
                  <td><strong>{el.title}</strong></td>
                  <td>{new Date(el.start_date).toLocaleDateString()}</td>
                  <td>{new Date(el.end_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`badge ${el.status === 'open' ? 'badge-approved' : el.status === 'closed' ? 'badge-rejected' : 'badge-pending'}`}>
                      {el.status}
                    </span>
                  </td>
                  <td>{el.candidates?.length || 0}</td>
                  <td>{el.total_votes || 0}</td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {el.status === 'draft' && <button className="btn btn-success btn-sm" onClick={() => changeStatus(el.id, 'open')}>Open Voting</button>}
                    {el.status === 'open' && <button className="btn btn-danger btn-sm" onClick={() => changeStatus(el.id, 'closed')}>Close Voting</button>}
                    <button className="btn btn-danger btn-sm" onClick={() => deleteElection(el.id)}>Delete</button>
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

// ── Candidates ────────────────────────────────────────────────
const Candidates = () => {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', position: POSITIONS[0], manifesto: '', photo: null });

  useEffect(() => { apiList('/elections/').then(setElections); }, []);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      api(`/elections/${selectedId}/`).then(r => {
        setCandidates(r.data.candidates || []);
        setLoading(false);
      });
    }
  }, [selectedId]);

  const submit = async e => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('position', form.position);
    fd.append('manifesto', form.manifesto);
    if (form.photo) fd.append('photo', form.photo);

    const token = localStorage.getItem('spe_access');
    const res = await fetch(`${API_BASE}/elections/${selectedId}/candidates/`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    const data = await res.json();
    if (res.ok) {
      setCandidates([...candidates, data]);
      setForm({ name: '', position: POSITIONS[0], manifesto: '', photo: null });
      setShowForm(false);
      setToast({ message: 'Candidate added successfully!', type: 'success' });
    } else setToast({ message: data?.name?.[0] || 'Failed to add candidate.', type: 'error' });
  };

  const toggleApprove = async (id, approved) => {
    const { ok, data } = await api(`/candidates/${id}/`, { method: 'PATCH', body: JSON.stringify({ approved }) });
    if (ok) {
      setCandidates(candidates.map(c => c.id === id ? data : c));
      setToast({ message: `Candidate ${approved ? 'approved' : 'revoked'}!`, type: 'success' });
    }
  };

  const deleteCandidate = async (id) => {
    if (!window.confirm('Delete this candidate?')) return;
    const { ok } = await api(`/candidates/${id}/`, { method: 'DELETE' });
    if (ok) { setCandidates(candidates.filter(c => c.id !== id)); setToast({ message: 'Candidate deleted.', type: 'success' }); }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#333' }}>Manage Candidates</h2>
        {selectedId && <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Candidate'}</button>}
      </div>

      <div style={{ marginBottom: 20 }}>
        <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #dde3f0', minWidth: 280, fontSize: '0.95rem' }}>
          <option value="">-- Select Election --</option>
          {elections.map(e => <option key={e.id} value={e.id}>{e.title} ({e.status})</option>)}
        </select>
      </div>

      {showForm && selectedId && (
        <div className="dash-form" style={{ marginBottom: 24 }}>
          <h3>Add Candidate</h3>
          <form onSubmit={submit}>
            <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group">
              <label>Position *</label>
              <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Manifesto</label><textarea value={form.manifesto} onChange={e => setForm({ ...form, manifesto: e.target.value })} rows={3} placeholder="Short manifesto (1-2 lines)" /></div>
            <div className="form-group">
              <label>Profile Photo</label>
              <input type="file" accept="image/*" onChange={e => setForm({ ...form, photo: e.target.files[0] })} />
            </div>
            <button className="btn btn-primary" type="submit">Add Candidate</button>
          </form>
        </div>
      )}

      {selectedId && (
        <div className="dash-table-wrap">
          <h3>Candidates {candidates.length > 0 && `(${candidates.length})`}</h3>
          {loading ? <Spinner /> : (
            <table>
              <thead><tr><th>Name</th><th>Position</th><th>Manifesto</th><th>Status</th><th>Votes</th><th>Actions</th></tr></thead>
              <tbody>
                {candidates.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No candidates yet</td></tr>}
                {candidates.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.name}</strong></td>
                    <td><span style={{ fontSize: '0.8rem', color: '#0066cc', fontWeight: 600 }}>{c.position}</span></td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.manifesto || '-'}</td>
                    <td><span className={`badge ${c.approved ? 'badge-approved' : 'badge-pending'}`}>{c.approved ? 'Approved' : 'Pending'}</span></td>
                    <td>{c.vote_count}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {!c.approved
                        ? <button className="btn btn-success btn-sm" onClick={() => toggleApprove(c.id, true)}>Approve</button>
                        : <button className="btn btn-sm" style={{ background: '#f0a500', color: '#fff' }} onClick={() => toggleApprove(c.id, false)}>Revoke</button>}
                      <button className="btn btn-danger btn-sm" onClick={() => deleteCandidate(c.id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  );
};

// ── Results ───────────────────────────────────────────────────
const Results = () => {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [selectedTitle, setSelectedTitle] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { apiList('/elections/').then(d => { setElections(d.filter(e => e.status === 'closed')); }); }, []);

  useEffect(() => {
    if (selectedId) {
      setLoading(true);
      fetch(`${API_BASE}/public/election/${selectedId}/results/`)
        .then(r => r.json()).then(d => { setResults(d); setLoading(false); });
    }
  }, [selectedId]);

  const grouped = {};
  (results?.results || []).forEach(c => {
    if (!grouped[c.position]) grouped[c.position] = [];
    grouped[c.position].push(c);
  });

  // Download as CSV
  const downloadCSV = () => {
    const rows = [['Position', 'Candidate', 'Votes', 'Percentage', 'Winner']];
    Object.entries(grouped).forEach(([position, candidates]) => {
      const winner = candidates.reduce((a, b) => a.vote_count > b.vote_count ? a : b, candidates[0]);
      candidates.sort((a, b) => b.vote_count - a.vote_count).forEach(c => {
        rows.push([position, c.name, c.vote_count, `${c.percentage}%`, c.id === winner.id ? 'YES' : '']);
      });
    });
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTitle || 'election'}_results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Download as plain text report
  const downloadTXT = () => {
    let txt = `ELECTION RESULTS REPORT\n`;
    txt += `Election: ${selectedTitle}\n`;
    txt += `Total Votes: ${results?.total_votes}\n`;
    txt += `Generated: ${new Date().toLocaleString()}\n`;
    txt += `${'='.repeat(50)}\n\n`;
    Object.entries(grouped).forEach(([position, candidates]) => {
      const winner = candidates.reduce((a, b) => a.vote_count > b.vote_count ? a : b, candidates[0]);
      txt += `POSITION: ${position}\n`;
      txt += `Winner: ${winner.name}\n`;
      txt += `${'-'.repeat(40)}\n`;
      candidates.sort((a, b) => b.vote_count - a.vote_count).forEach((c, i) => {
        txt += `${i + 1}. ${c.name.padEnd(30)} ${c.vote_count} votes (${c.percentage}%)${c.id === winner.id ? ' 🏆' : ''}\n`;
      });
      txt += '\n';
    });
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedTitle || 'election'}_results.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ color: '#333' }}>Election Results</h2>
        {results && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ background: '#198754', color: '#fff' }} onClick={downloadCSV}>
              ⬇ Download CSV
            </button>
            <button className="btn btn-sm" style={{ background: '#0066cc', color: '#fff' }} onClick={downloadTXT}>
              ⬇ Download Report
            </button>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 24 }}>
        <select value={selectedId} onChange={e => {
          setSelectedId(e.target.value);
          setSelectedTitle(elections.find(el => String(el.id) === e.target.value)?.title || '');
        }}
          style={{ padding: '10px 14px', borderRadius: 8, border: '1.5px solid #dde3f0', minWidth: 280, fontSize: '0.95rem' }}>
          <option value="">-- Select Closed Election --</option>
          {elections.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select>
      </div>

      {loading && <Spinner />}

      {results && !loading && (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            <StatCard label="Total Votes Cast" value={results.total_votes} />
            <StatCard label="Positions" value={Object.keys(grouped).length} />
          </div>
          {Object.entries(grouped).map(([position, candidates]) => {
            const winner = candidates.reduce((a, b) => a.vote_count > b.vote_count ? a : b, candidates[0]);
            return (
              <div key={position} className="dash-table-wrap" style={{ marginBottom: 20 }}>
                <h3>{position} — 🏆 Winner: <span style={{ color: '#00a86b' }}>{winner.name}</span></h3>
                <table>
                  <thead><tr><th>Candidate</th><th>Votes</th><th>Percentage</th><th>Result</th></tr></thead>
                  <tbody>
                    {candidates.sort((a, b) => b.vote_count - a.vote_count).map(c => (
                      <tr key={c.id} style={{ background: c.id === winner.id ? '#f0fff4' : '' }}>
                        <td><strong>{c.name}</strong> {c.id === winner.id && '🏆'}</td>
                        <td>{c.vote_count}</td>
                        <td>{c.percentage}%</td>
                        <td>
                          <div style={{ background: '#e8f0fe', borderRadius: 6, height: 10, width: 150 }}>
                            <div style={{ background: c.id === winner.id ? '#00a86b' : '#0066cc', width: `${c.percentage}%`, height: '100%', borderRadius: 6 }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}
    </>
  );
};

// ── Leadership ────────────────────────────────────────────────
const ManageLeadership = () => {
  const [members, setMembers] = useState([]);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ name: '', position: POSITIONS[0], image: null });
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', image: null });
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [advancing, setAdvancing] = useState(false);

  const defaultPositions = POSITIONS;

  const createPlaceholder = (position) => {
    const initials = position.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#0052a3"/><stop offset="100%" stop-color="#12a4d9"/></linearGradient></defs><rect width="160" height="160" fill="url(#bg)"/><circle cx="80" cy="60" r="28" fill="rgba(255,255,255,0.22)"/><path d="M41 129c7-22 26-35 39-35s32 13 39 35" fill="rgba(255,255,255,0.22)"/><text x="80" y="147" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#fff">${initials}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  // Load available years
  useEffect(() => {
    fetch(`${API_BASE}/leadership/years/`)
      .then(r => r.json())
      .then(d => {
        const ys = d.years || [];
        setYears(ys);
        if (!activeYear) setActiveYear(ys[ys.length - 1] || '');
      })
      .catch(() => {});
  }, []); // eslint-disable-line

  // Load members for selected year
  useEffect(() => {
    if (!activeYear) return;
    const token = localStorage.getItem('spe_access');
    fetch(`${API_BASE}/leadership/?year=${encodeURIComponent(activeYear)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(d => {
        const map = new Map((d.members || []).map(m => [m.position, m]));
        setMembers(defaultPositions.map(p => map.get(p) || { position: p, name: 'To Be Announced', image_url: '' }));
      })
      .catch(() => {});
  }, [activeYear]); // eslint-disable-line

  const doFetch = async (url, fd, method = 'POST') => {
    let token = localStorage.getItem('spe_access');
    let res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (res.status === 401) {
      const rRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: localStorage.getItem('spe_refresh') }),
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        localStorage.setItem('spe_access', rData.access);
        res = await fetch(url, { method, headers: { Authorization: `Bearer ${rData.access}` }, body: fd });
      }
    }
    return res;
  };

  const advanceYear = async () => {
    if (!window.confirm(`Advance from ${activeYear} to next year? This creates a new empty leadership year.`)) return;
    setAdvancing(true);
    const token = localStorage.getItem('spe_access');
    const res = await fetch(`${API_BASE}/leadership/advance-year/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ current_year: activeYear }),
    });
    const data = await res.json().catch(() => ({}));
    setAdvancing(false);
    if (res.ok) {
      const ny = data.next_year;
      setYears(prev => prev.includes(ny) ? prev : [...prev, ny]);
      setActiveYear(ny);
      setToast({ message: `Advanced to ${ny}! Now add members for this year.`, type: 'success' });
    } else setToast({ message: data.error || 'Failed to advance year.', type: 'error' });
  };

  const submit = async e => {
    e.preventDefault();
    const fd = new FormData();
    
    fd.append('name', form.name);
    fd.append('position', form.position);
    fd.append('year', activeYear);
    if (form.image) fd.append('image', form.image);
    const res = await doFetch(`${API_BASE}/leadership/manage/`, fd);
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMembers(prev => prev.map(m => m.position === data.position ? data : m));
      setForm({ name: '', position: POSITIONS[0], image: null });
      setToast({ message: 'Leadership member saved!', type: 'success' });
    } else setToast({ message: data.error || 'Failed to save.', type: 'error' });
  };

  const submitEdit = async e => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', editForm.name);
    if (editForm.image) fd.append('image', editForm.image);
    const res = await doFetch(`${API_BASE}/leadership/${editItem.id}/`, fd, 'PATCH');
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setMembers(prev => prev.map(m => m.position === data.position ? data : m));
      setEditItem(null);
      setToast({ message: 'Updated!', type: 'success' });
    } else setToast({ message: 'Failed to update.', type: 'error' });
  };

  const deleteMember = async (item) => {
    if (!item.id) { setToast({ message: 'No record to delete.', type: 'error' }); return; }
    if (!window.confirm(`Reset ${item.position}?`)) return;
    const token = localStorage.getItem('spe_access');
    await fetch(`${API_BASE}/leadership/${item.id}/`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setMembers(prev => prev.map(m => m.position === item.position ? { position: item.position, name: 'To Be Announced', image_url: '' } : m));
    setToast({ message: 'Member removed.', type: 'success' });
  };

  // Compute next year label for button
  const nextYearLabel = (() => {
    if (!activeYear) return '';
    const start = parseInt(activeYear.split('/')[0], 10);
    return isNaN(start) ? '' : `${start + 1}/${start + 2}`;
  })();
  const alreadyAdvanced = years.includes(nextYearLabel);

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 320, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: 14 }}>Edit: {editItem.position}</h3>
            <form onSubmit={submitEdit}>
              <div className="form-group"><label>Name</label><input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} required /></div>
              <div className="form-group"><label>Photo (optional)</label><input type="file" accept="image/*" onChange={e => setEditForm({ ...editForm, image: e.target.files[0] })} /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" type="submit">Save</button>
                <button className="btn btn-sm" style={{ background: '#f0f0f0' }} type="button" onClick={() => setEditItem(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Year dropdown + advance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <label style={{ fontWeight: 700, color: '#333', fontSize: '0.9rem' }}>Academic Year:</label>
        <select
          value={activeYear}
          onChange={e => setActiveYear(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #0066cc', color: '#0052a3', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', outline: 'none', minWidth: 150 }}
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {!alreadyAdvanced && nextYearLabel && (
          <button onClick={advanceYear} disabled={advancing}
            style={{ padding: '8px 18px', borderRadius: 8, border: '2px dashed #0066cc', background: '#fff', color: '#0066cc', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', opacity: advancing ? 0.6 : 1 }}>
            {advancing ? 'Advancing...' : `+ Advance to ${nextYearLabel}`}
          </button>
        )}
      </div>

      {/* Add Form */}
      <div className="dash-form" style={{ marginBottom: 24 }}>
        <h3>Add / Update Member — <span style={{ color: '#0066cc' }}>{activeYear}</span></h3>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Position</label>
            <select value={form.position} onChange={e => setForm({ ...form, position: e.target.value })}>
              {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group"><label>Full Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
          <div className="form-group"><label>Photo</label><input type="file" accept="image/*" onChange={e => setForm({ ...form, image: e.target.files[0] })} /></div>
          <button className="btn btn-primary" type="submit">Save</button>
        </form>
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
        {members.map(m => (
          <div key={m.position} style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: '1px solid #eef2ff' }}>
            <img src={m.image_url || createPlaceholder(m.position)} alt={m.position}
              style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }} />
            <div style={{ padding: '10px 12px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1a2e', marginBottom: 4 }}>{m.name}</p>
              <span style={{ background: '#eef4ff', color: '#0052a3', fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: 20, display: 'inline-block', marginBottom: 8 }}>{m.position}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button className="btn btn-sm" style={{ background: '#f0a500', color: '#fff', fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => { setEditItem(m); setEditForm({ name: m.name, image: null }); }}>✏ Edit</button>
                <button className="btn btn-danger btn-sm" style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                  onClick={() => deleteMember(m)}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

// ── Publications ──────────────────────────────────────────────
const Publications = () => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', content: '', file: null, type: 'article' });
  const [toast, setToast] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', content: '', type: 'article' });

  useEffect(() => { apiList('/publications/').then(d => { setList(d); setLoading(false); }); }, []);

  const buildFd = (f) => {
    const fd = new FormData();
    fd.append('title', f.title);
    fd.append('content', f.content || ' ');
    fd.append('pub_type', f.type);
    if (f.file) fd.append('file', f.file);
    return fd;
  };

  const doFetch = async (url, fd, method = 'POST') => {
    let token = localStorage.getItem('spe_access');
    let res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
    if (res.status === 401) {
      const rRes = await fetch(`${API_BASE}/auth/token/refresh/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: localStorage.getItem('spe_refresh') }),
      });
      if (rRes.ok) {
        const rData = await rRes.json();
        localStorage.setItem('spe_access', rData.access);
        res = await fetch(url, { method, headers: { Authorization: `Bearer ${rData.access}` }, body: buildFd(form) });
      }
    }
    return res;
  };

  const submit = async e => {
    e.preventDefault();
    const res = await doFetch(`${API_BASE}/publications/`, buildFd(form));
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setList([data, ...list]);
      setForm({ title: '', content: '', file: null, type: 'article' });
      setToast({ message: 'Publication uploaded!', type: 'success' });
    } else {
      setToast({ message: `Failed: ${data?.title?.[0] || data?.detail || data?.error || JSON.stringify(data)}`, type: 'error' });
    }
  };

  const submitEdit = async e => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', editForm.title);
    fd.append('content', editForm.content || ' ');
    fd.append('pub_type', editForm.type);
    if (editForm.file) fd.append('file', editForm.file);
    const res = await doFetch(`${API_BASE}/publications/${editItem.id}/`, fd, 'PATCH');
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setList(list.map(p => p.id === editItem.id ? data : p));
      setEditItem(null);
      setToast({ message: 'Publication updated!', type: 'success' });
    } else {
      setToast({ message: `Failed: ${data?.detail || data?.error || JSON.stringify(data)}`, type: 'error' });
    }
  };

  const deletePublication = async (id) => {
    if (!window.confirm('Delete this publication?')) return;
    const { ok } = await api(`/publications/${id}/`, { method: 'DELETE' });
    if (ok) { setList(list.filter(p => p.id !== id)); setToast({ message: 'Publication deleted.', type: 'success' }); }
    else setToast({ message: 'Failed to delete.', type: 'error' });
  };

  const openFile = (fileUrl) => {
    const url = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin.replace(':3000', ':8000')}${fileUrl}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadFile = async (fileUrl, title) => {
    try {
      const url = fileUrl.startsWith('http') ? fileUrl : `${window.location.origin.replace(':3000', ':8000')}${fileUrl}`;
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = title || 'publication';
      a.click();
      URL.revokeObjectURL(a.href);
    } catch { setToast({ message: 'Download failed.', type: 'error' }); }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Edit Modal */}
      {editItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 24, width: 360, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginBottom: 14 }}>Edit Publication</h3>
            <form onSubmit={submitEdit}>
              <div className="form-group">
                <label>Type</label>
                <select value={editForm.type} onChange={e => setEditForm({ ...editForm, type: e.target.value })}>
                  <option value="article">Article</option>
                  <option value="journal">Journal</option>
                  <option value="document">Document</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div className="form-group"><label>Title</label><input value={editForm.title} onChange={e => setEditForm({ ...editForm, title: e.target.value })} required /></div>
              <div className="form-group"><label>Description</label><textarea value={editForm.content} onChange={e => setEditForm({ ...editForm, content: e.target.value })} rows={2} /></div>
              <div className="form-group"><label>Replace File (optional)</label><input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={e => setEditForm({ ...editForm, file: e.target.files[0] })} /></div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button className="btn btn-primary btn-sm" type="submit">Save</button>
                <button className="btn btn-sm" style={{ background: '#f0f0f0' }} type="button" onClick={() => setEditItem(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="dash-form" style={{ marginBottom: 24 }}>
        <h3>Upload Publication</h3>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="article">Article</option>
              <option value="journal">Journal</option>
              <option value="document">Document</option>
              <option value="image">Image</option>
            </select>
          </div>
          <div className="form-group"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
          <div className="form-group"><label>Description</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={2} /></div>
          <div className="form-group">
            <label>Upload File</label>
            <input type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt" onChange={e => setForm({ ...form, file: e.target.files[0] })} />
          </div>
          <button className="btn btn-primary" type="submit">Upload</button>
        </form>
      </div>

      <div className="dash-table-wrap">
        <h3>All Publications</h3>
        {loading ? <Spinner /> : (
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Published By</th><th>Date</th><th>File</th><th>Actions</th></tr></thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888' }}>No publications yet</td></tr>}
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
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm" style={{ background: '#f0a500', color: '#fff' }}
                      onClick={() => { setEditItem(p); setEditForm({ title: p.title, content: p.content, type: p.pub_type || 'article', file: null }); }}>✏</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deletePublication(p.id)}>Delete</button>
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

// ── Annual Report ─────────────────────────────────────────────
const EMPTY_ROW = { item_source: '', expenditure: '', total_expenditure: '', outstanding_balance: '', balance: '' };

const ImageUploadBox = ({ label, images, onUpload, onDelete }) => {
  const ref = React.useRef();
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <span style={{ fontWeight: 600, fontSize: '0.88rem', color: '#333' }}>{label}</span>
        <button type="button" className="btn btn-sm" style={{ background: '#0066cc', color: '#fff', fontSize: '0.78rem' }}
          onClick={() => ref.current.click()}>📷 Upload Image</button>
        <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); e.target.value = ''; }} />
      </div>
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {images.map(img => (
            <div key={img.id} style={{ position: 'relative', width: 90, height: 90 }}>
              <img src={img.url} alt={img.caption} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, border: '1px solid #dde3f0' }} />
              <button type="button" onClick={() => onDelete(img.id)}
                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(220,38,38,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: '0.7rem', lineHeight: '20px', textAlign: 'center', padding: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const AnnualReport = () => {
  const [years, setYears] = useState([]);
  const [activeYear, setActiveYear] = useState('');
  const [report, setReport] = useState(null);
  const [toast, setToast] = useState(null);
  const [saving, setSaving] = useState(false);
  const [newRow, setNewRow] = useState(EMPTY_ROW);
  const [editRowId, setEditRowId] = useState(null);
  const [editRowData, setEditRowData] = useState(EMPTY_ROW);

  const token = () => localStorage.getItem('spe_access');

  // Load year list
  useEffect(() => {
    fetch(`${API_BASE}/leadership/years/`).then(r => r.json()).then(d => {
      const ys = d.years || [];
      setYears(ys);
      if (ys.length) setActiveYear(ys[ys.length - 1]);
    }).catch(() => {});
  }, []);

  // Load report for selected year
  useEffect(() => {
    if (!activeYear) return;
    fetch(`${API_BASE}/annual-reports/${encodeURIComponent(activeYear)}/`, {
      headers: { Authorization: `Bearer ${token()}` },
    }).then(r => r.ok ? r.json() : null).then(d => setReport(d)).catch(() => setReport(null));
  }, [activeYear]);

  const authFetch = async (url, opts = {}) => {
    const res = await fetch(url, { ...opts, headers: { Authorization: `Bearer ${token()}`, ...(opts.headers || {}) } });
    return res;
  };

  const saveSection = async (fields) => {
    setSaving(true);
    const fd = new FormData();
    Object.entries(fields).forEach(([k, v]) => { if (v !== undefined && v !== null) fd.append(k, v); });
    const res = await authFetch(`${API_BASE}/annual-reports/${encodeURIComponent(activeYear)}/`, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      setToast({ message: 'Saved!', type: 'success' });
      // Reload
      fetch(`${API_BASE}/annual-reports/${encodeURIComponent(activeYear)}/`, {
        headers: { Authorization: `Bearer ${token()}` },
      }).then(r => r.json()).then(setReport).catch(() => {});
    } else setToast({ message: data.error || 'Save failed.', type: 'error' });
  };

  const uploadSectionImage = async (section, file) => {
    const fd = new FormData();
    fd.append('image', file);
    const res = await authFetch(`${API_BASE}/annual-reports/${encodeURIComponent(activeYear)}/images/${section}/`, { method: 'POST', body: fd });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setReport(prev => ({ ...prev, [`${section}_images`]: [...(prev[`${section}_images`] || []), data] }));
    } else setToast({ message: data.error || 'Upload failed.', type: 'error' });
  };

  const deleteImage = async (imgId, section) => {
    await authFetch(`${API_BASE}/annual-reports/images/${imgId}/`, { method: 'DELETE' });
    setReport(prev => ({ ...prev, [`${section}_images`]: prev[`${section}_images`].filter(i => i.id !== imgId) }));
  };

  const addFinancialRow = async () => {
    if (!newRow.item_source.trim()) return setToast({ message: 'Item source is required.', type: 'error' });
    const res = await authFetch(`${API_BASE}/annual-reports/${encodeURIComponent(activeYear)}/financial/`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(newRow),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setReport(prev => ({ ...prev, financial_items: [...(prev.financial_items || []), data] }));
      setNewRow(EMPTY_ROW);
    } else setToast({ message: data.error || 'Failed to add row.', type: 'error' });
  };

  const saveEditRow = async () => {
    const res = await authFetch(`${API_BASE}/annual-reports/${encodeURIComponent(activeYear)}/financial/`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editRowId, ...editRowData }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setReport(prev => ({ ...prev, financial_items: prev.financial_items.map(r => r.id === editRowId ? data : r) }));
      setEditRowId(null);
    } else setToast({ message: 'Failed to update row.', type: 'error' });
  };

  const deleteFinancialRow = async (id) => {
    await authFetch(`${API_BASE}/annual-reports/${encodeURIComponent(activeYear)}/financial/`, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    setReport(prev => ({ ...prev, financial_items: prev.financial_items.filter(r => r.id !== id) }));
  };

  const fi = report?.financial_items || [];
  const totalExpenditure = fi.reduce((s, r) => s + parseFloat(r.total_expenditure || 0), 0);
  const totalBalance = fi.reduce((s, r) => s + parseFloat(r.balance || 0), 0);

  const sectionStyle = { background: '#fff', borderRadius: 12, boxShadow: '0 2px 10px rgba(0,0,0,0.07)', padding: '20px 24px', marginBottom: 24 };
  const sectionTitle = (n, emoji) => (
    <h3 style={{ color: '#0052a3', marginBottom: 14, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ background: '#eef4ff', borderRadius: 8, padding: '4px 10px' }}>{emoji} {n}</span>
    </h3>
  );

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
        <h2 style={{ color: '#333', margin: 0 }}>📋 Annual Report</h2>
        <select value={activeYear} onChange={e => setActiveYear(e.target.value)}
          style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #0066cc', color: '#0052a3', fontWeight: 700, fontSize: '0.9rem', outline: 'none', minWidth: 150 }}>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        {saving && <span style={{ color: '#0066cc', fontSize: '0.85rem' }}>Saving…</span>}
      </div>

      {/* 1. President Message */}
      <div style={sectionStyle}>
        {sectionTitle('1. President\'s Message', '🎙️')}
        <PresidentMessageSection report={report} onSave={saveSection} />
      </div>

      {/* 2. Membership Statistics */}
      <div style={sectionStyle}>
        {sectionTitle('2. Membership Statistics', '👥')}
        <MembershipSection report={report} onSave={saveSection} />
      </div>

      {/* 3. Financial Status */}
      <div style={sectionStyle}>
        {sectionTitle('3. Financial Status', '💰')}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: 12 }}>
          <thead>
            <tr style={{ background: '#eef4ff' }}>
              {['Item / Source', 'Expenditure (TZS)', 'Total Expenditure (TZS)', 'Outstanding Balance (TZS)', 'Balance (TZS)', 'Actions'].map(h => (
                <th key={h} style={{ padding: '9px 12px', textAlign: 'left', color: '#0052a3', fontWeight: 700, borderBottom: '2px solid #d0e0ff', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fi.map(row => (
              <tr key={row.id} style={{ borderBottom: '1px solid #eee' }}>
                {editRowId === row.id ? (
                  <>
                    {['item_source','expenditure','total_expenditure','outstanding_balance','balance'].map(f => (
                      <td key={f} style={{ padding: '6px 8px' }}>
                        <input value={editRowData[f]} onChange={e => setEditRowData(p => ({ ...p, [f]: e.target.value }))}
                          style={{ width: '100%', padding: '4px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                      </td>
                    ))}
                    <td style={{ padding: '6px 8px', display: 'flex', gap: 4 }}>
                      <button className="btn btn-success btn-sm" onClick={saveEditRow}>Save</button>
                      <button className="btn btn-sm" style={{ background: '#eee' }} onClick={() => setEditRowId(null)}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '8px 12px', fontWeight: 600 }}>{row.item_source}</td>
                    <td style={{ padding: '8px 12px' }}>{Number(row.expenditure).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px' }}>{Number(row.total_expenditure).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px' }}>{Number(row.outstanding_balance).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px', color: Number(row.balance) >= 0 ? '#198754' : '#dc3545', fontWeight: 700 }}>{Number(row.balance).toLocaleString()}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm" style={{ background: '#f0a500', color: '#fff', fontSize: '0.75rem' }}
                          onClick={() => { setEditRowId(row.id); setEditRowData({ item_source: row.item_source, expenditure: row.expenditure, total_expenditure: row.total_expenditure, outstanding_balance: row.outstanding_balance, balance: row.balance }); }}>✏</button>
                        <button className="btn btn-danger btn-sm" style={{ fontSize: '0.75rem' }} onClick={() => deleteFinancialRow(row.id)}>🗑</button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {/* Totals row */}
            {fi.length > 0 && (
              <tr style={{ background: '#f0f7ff', fontWeight: 700 }}>
                <td style={{ padding: '8px 12px' }}>TOTAL</td>
                <td /><td style={{ padding: '8px 12px' }}>{totalExpenditure.toLocaleString()}</td>
                <td /><td style={{ padding: '8px 12px', color: totalBalance >= 0 ? '#198754' : '#dc3545' }}>{totalBalance.toLocaleString()}</td>
                <td />
              </tr>
            )}
            {/* Add new row */}
            <tr style={{ background: '#f8faff' }}>
              {['item_source','expenditure','total_expenditure','outstanding_balance','balance'].map(f => (
                <td key={f} style={{ padding: '6px 8px' }}>
                  <input placeholder={f === 'item_source' ? 'Item / Source' : '0'} value={newRow[f]}
                    onChange={e => setNewRow(p => ({ ...p, [f]: e.target.value }))}
                    style={{ width: '100%', padding: '5px 8px', borderRadius: 6, border: '1px solid #ccc', fontSize: '0.82rem' }} />
                </td>
              ))}
              <td style={{ padding: '6px 8px' }}>
                <button className="btn btn-primary btn-sm" onClick={addFinancialRow} disabled={!report}>+ Add</button>
              </td>
            </tr>
          </tbody>
        </table>
        {!report && <p style={{ color: '#888', fontSize: '0.82rem' }}>Save the report first to add financial rows.</p>}
      </div>

      {/* 4. Events */}
      <div style={sectionStyle}>
        {sectionTitle('4. Events', '📅')}

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, color: '#0052a3', marginBottom: 8, fontSize: '0.9rem' }}>i. Technical Dissemination & Professional Development</p>
          <textarea rows={3} defaultValue={report?.technical_dissemination || ''} id="technical_dissemination"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', resize: 'vertical' }}
            placeholder="Describe technical dissemination and professional development activities…" />
          <ImageUploadBox label="Photos" images={report?.technical_images || []}
            onUpload={f => uploadSectionImage('technical', f)} onDelete={id => deleteImage(id, 'technical')} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}
            onClick={() => saveSection({ technical_dissemination: document.getElementById('technical_dissemination').value })}>Save</button>
        </div>

        <div style={{ marginBottom: 20 }}>
          <p style={{ fontWeight: 700, color: '#0052a3', marginBottom: 8, fontSize: '0.9rem' }}>ii. Community Engagement</p>
          <textarea rows={3} defaultValue={report?.community_engagement || ''} id="community_engagement"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', resize: 'vertical' }}
            placeholder="Describe community engagement activities…" />
          <ImageUploadBox label="Photos" images={report?.community_images || []}
            onUpload={f => uploadSectionImage('community', f)} onDelete={id => deleteImage(id, 'community')} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}
            onClick={() => saveSection({ community_engagement: document.getElementById('community_engagement').value })}>Save</button>
        </div>

        <div style={{ marginBottom: 8 }}>
          <p style={{ fontWeight: 700, color: '#0052a3', marginBottom: 8, fontSize: '0.9rem' }}>iii. Member Recognition & Appreciation</p>
          <textarea rows={3} defaultValue={report?.member_recognition || ''} id="member_recognition"
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', resize: 'vertical' }}
            placeholder="Describe member recognition and appreciation activities…" />
          <ImageUploadBox label="Photos" images={report?.recognition_images || []}
            onUpload={f => uploadSectionImage('recognition', f)} onDelete={id => deleteImage(id, 'recognition')} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 4 }}
            onClick={() => saveSection({ member_recognition: document.getElementById('member_recognition').value })}>Save</button>
        </div>
      </div>

      {/* 5. Challenges */}
      <div style={sectionStyle}>
        {sectionTitle('5. Challenges', '⚠️')}
        <textarea rows={4} defaultValue={report?.challenges || ''} id="challenges"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', resize: 'vertical' }}
          placeholder="Describe challenges faced during the year…" />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}
          onClick={() => saveSection({ challenges: document.getElementById('challenges').value })}>Save</button>
      </div>

      {/* 6. Recommendations */}
      <div style={sectionStyle}>
        {sectionTitle('6. Recommendations', '💡')}
        <textarea rows={4} defaultValue={report?.recommendations || ''} id="recommendations"
          style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', resize: 'vertical' }}
          placeholder="List recommendations for the next year…" />
        <button className="btn btn-primary btn-sm" style={{ marginTop: 8 }}
          onClick={() => saveSection({ recommendations: document.getElementById('recommendations').value })}>Save</button>
      </div>
    </>
  );
};

// Sub-components to avoid stale closure on textarea defaultValue
const PresidentMessageSection = ({ report, onSave }) => {
  const [msg, setMsg] = React.useState(report?.president_message || '');
  const [imgFile, setImgFile] = React.useState(null);
  const imgRef = React.useRef();
  React.useEffect(() => { setMsg(report?.president_message || ''); }, [report]);
  return (
    <div>
      <textarea rows={5} value={msg} onChange={e => setMsg(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', resize: 'vertical', marginBottom: 10 }}
        placeholder="Write the president's message for this year…" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm" style={{ background: '#0066cc', color: '#fff' }} onClick={() => imgRef.current.click()}>📷 Upload President Photo</button>
        <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setImgFile(e.target.files[0])} />
        {imgFile && <span style={{ fontSize: '0.8rem', color: '#555' }}>{imgFile.name}</span>}
        {report?.president_image && !imgFile && <img src={report.president_image} alt="President" style={{ height: 48, borderRadius: 8, border: '1px solid #dde3f0' }} />}
        <button className="btn btn-primary btn-sm" onClick={() => onSave({ president_message: msg, ...(imgFile ? { president_image: imgFile } : {}) })}>Save</button>
      </div>
    </div>
  );
};

const MembershipSection = ({ report, onSave }) => {
  const [stats, setStats] = React.useState(report?.membership_statistics || '');
  const [chartFile, setChartFile] = React.useState(null);
  const chartRef = React.useRef();
  React.useEffect(() => { setStats(report?.membership_statistics || ''); }, [report]);
  return (
    <div>
      <textarea rows={4} value={stats} onChange={e => setStats(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', resize: 'vertical', marginBottom: 10 }}
        placeholder="e.g. Total members: 120, New members: 45, Active: 98…" />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-sm" style={{ background: '#0066cc', color: '#fff' }} onClick={() => chartRef.current.click()}>📊 Upload Chart / Graph</button>
        <input ref={chartRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setChartFile(e.target.files[0])} />
        {chartFile && <span style={{ fontSize: '0.8rem', color: '#555' }}>{chartFile.name}</span>}
        {report?.membership_chart && !chartFile && <img src={report.membership_chart} alt="Chart" style={{ height: 48, borderRadius: 8, border: '1px solid #dde3f0' }} />}
        <button className="btn btn-primary btn-sm" onClick={() => onSave({ membership_statistics: stats, ...(chartFile ? { membership_chart: chartFile } : {}) })}>Save</button>
      </div>
    </div>
  );
};

// ── Secretary Dashboard ───────────────────────────────────────
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
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#0f766e,#0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.8rem', fontWeight: 800, flexShrink: 0 }}>
          {user?.full_name?.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 style={{ color: '#1a1a2e', marginBottom: 4 }}>{user?.full_name}</h3>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>{user?.email}</p>
          <span style={{ background: '#ccfbf1', color: '#115e59', padding: '2px 12px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700 }}>GENERAL SECRETARY</span>
        </div>
      </div>

      <ProfileExperience user={user} roleLabel="General Secretary" accent="teal" />

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
              { label: 'Role', value: 'General Secretary' },
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

const SecretaryDashboard = () => (
  <DashboardLayout>
    <Routes>
      <Route path="/" element={<SecretaryOverview />} />
      <Route path="/elections" element={<Elections />} />
      <Route path="/candidates" element={<Candidates />} />
      <Route path="/results" element={<Results />} />
      <Route path="/analytics" element={<ElectionAnalytics />} />
      <Route path="/publications" element={<Publications />} />
      <Route path="/records" element={<Publications />} />
      <Route path="/leadership" element={<ManageLeadership />} />
      <Route path="/annual-report" element={<AnnualReport />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  </DashboardLayout>
);

export default SecretaryDashboard;
