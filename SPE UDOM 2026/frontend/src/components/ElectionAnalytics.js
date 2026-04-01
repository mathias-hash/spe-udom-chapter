import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LabelList
} from 'recharts';
import { apiList } from '../utils/api';

const COLORS = ['#0055b3','#0099ff','#00c49f','#ff8042','#a855f7','#f59e0b','#ef4444','#10b981'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ background: '#fff', border: '1px solid #e0e7ff', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <p style={{ fontWeight: 700, color: '#1a1a2e', marginBottom: 4 }}>{label}</p>
        <p style={{ color: '#0055b3', fontWeight: 600 }}>{payload[0].value}% of votes</p>
        <p style={{ color: '#888', fontSize: '0.78rem' }}>{payload[0].payload.vote_count} votes</p>
      </div>
    );
  }
  return null;
};

const PositionChart = ({ position, candidates, totalVotes }) => {
  const data = candidates.map(c => ({
    name: c.name.split(' ')[0],
    fullName: c.name,
    percentage: totalVotes > 0 ? parseFloat(((c.vote_count / totalVotes) * 100).toFixed(1)) : 0,
    vote_count: c.vote_count,
  }));

  const winner = [...candidates].sort((a, b) => b.vote_count - a.vote_count)[0];

  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '18px 16px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', border: '1px solid #eef2ff', marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div>
          <h4 style={{ color: '#0055b3', fontWeight: 700, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{position}</h4>
          <p style={{ color: '#888', fontSize: '0.75rem', margin: '2px 0 0' }}>{candidates.length} candidate{candidates.length !== 1 ? 's' : ''} - {totalVotes} total votes</p>
        </div>
        {winner && winner.vote_count > 0 && (
          <div style={{ background: '#d1fae5', color: '#065f46', padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700 }}>
            Winner: {winner.name.split(' ')[0]}
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 16, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#555' }} axisLine={false} tickLine={false} />
          <YAxis domain={[0, 100]} tickFormatter={v => `${v}%`} tick={{ fontSize: 10, fill: '#888' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="percentage" radius={[6, 6, 0, 0]} maxBarSize={60}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            <LabelList dataKey="percentage" position="top" formatter={v => `${v}%`} style={{ fontSize: 11, fontWeight: 700, fill: '#333' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ElectionAnalytics = () => {
  const [elections, setElections] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiList('/elections/').then(list => {
      setElections(list);
      // Auto-select first closed or open election
      const auto = list.find(e => e.status === 'closed') || list.find(e => e.status === 'open') || list[0];
      if (auto) setSelectedId(String(auto.id));
    });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    fetch(`http://localhost:8000/api/public/election/${selectedId}/results/`)
      .then(r => r.json())
      .then(d => { setResults(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedId]);

  // Group results by position
  const grouped = {};
  (results?.results || []).forEach(c => {
    if (!grouped[c.position]) grouped[c.position] = [];
    grouped[c.position].push(c);
  });

  const totalVotes = results?.total_votes || 0;

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ color: '#1a1a2e', margin: 0 }}>Election Analytics</h3>
          <p style={{ color: '#888', fontSize: '0.8rem', margin: '3px 0 0' }}>Vote distribution by candidate per position</p>
        </div>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 8, border: '1.5px solid #dde3f0', fontSize: '0.88rem', outline: 'none', minWidth: 200 }}
        >
          <option value="">Select Election</option>
          {elections.map(e => (
            <option key={e.id} value={e.id}>{e.title} ({e.status})</option>
          ))}
        </select>
      </div>

      {loading && <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>Loading analytics...</p>}

      {!loading && selectedId && Object.keys(grouped).length === 0 && (
        <p style={{ color: '#888', textAlign: 'center', padding: 20 }}>No vote data available for this election yet.</p>
      )}

      {!loading && Object.entries(grouped).map(([position, candidates]) => (
        <PositionChart
          key={position}
          position={position}
          candidates={candidates}
          totalVotes={totalVotes}
        />
      ))}
    </div>
  );
};

export default ElectionAnalytics;
