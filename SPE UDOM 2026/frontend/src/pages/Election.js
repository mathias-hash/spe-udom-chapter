import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, API_BASE } from '../utils/api';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import './Election.css';

const statusColor = { open: '#00a86b', closed: '#dc3545', draft: '#888', upcoming: '#f0a500' };

const CandidateCard = ({ candidate, canVote, hasVoted, onVote, isClosed }) => (
  <div className={`candidate-card ${hasVoted ? 'voted' : ''}`}>
    <div className="candidate-photo">
      {candidate.photo_url
        ? <img src={candidate.photo_url} alt={candidate.name} />
        : <div className="photo-placeholder">{candidate.name.charAt(0)}</div>}
    </div>
    <div className="candidate-info">
      <h3>{candidate.name}</h3>
      <span className="candidate-position">{candidate.position}</span>
      {candidate.manifesto && <p className="candidate-manifesto">"{candidate.manifesto}"</p>}
      {isClosed && (
        <div className="result-bar-wrap">
          <div className="result-bar" style={{ width: `${candidate.percentage || 0}%` }} />
          <span className="result-stats">{candidate.vote_count} votes ({candidate.percentage || 0}%)</span>
        </div>
      )}
    </div>
    {canVote && !hasVoted && (
      <button className="vote-btn" onClick={() => onVote(candidate.id, candidate.position)}>
        Vote
      </button>
    )}
    {hasVoted && <span className="voted-badge">✓ Voted</span>}
  </div>
);

const Election = () => {
  const { user } = useAuth();
  const [election, setElection] = useState(null);
  const [results, setResults] = useState(null);
  const [votedPositions, setVotedPositions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadElection = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/public/election/`);
      if (!res.ok) { setElection(null); setLoading(false); return; }
      const data = await res.json();
      setElection(data);

      if (data.status === 'closed') {
        const rRes = await fetch(`${API_BASE}/public/election/${data.id}/results/`);
        if (rRes.ok) setResults(await rRes.json());
      }

      if (user && data.status === 'open') {
        const vRes = await api(`/elections/${data.id}/my-votes/`);
        if (vRes.ok) setVotedPositions(vRes.data.voted_positions || []);
      }
    } catch (e) {
      setElection(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { loadElection(); }, [loadElection]);

  const handleVote = async (candidateId, position) => {
    if (!user) { setToast({ message: 'Please login to vote.', type: 'error' }); return; }
    setSubmitting(true);
    const { ok, data } = await api(`/elections/${election.id}/vote/`, {
      method: 'POST',
      body: JSON.stringify({ candidate_id: candidateId }),
    });
    if (ok) {
      setVotedPositions(prev => [...prev, position]);
      setToast({ message: 'Vote cast successfully! ✓', type: 'success' });
    } else {
      setToast({ message: data?.error || 'Failed to cast vote.', type: 'error' });
    }
    setSubmitting(false);
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

  // Group results by position
  const groupResultsByPosition = (resultsList) => {
    const groups = {};
    (resultsList || []).forEach(c => {
      if (!groups[c.position]) groups[c.position] = [];
      groups[c.position].push(c);
    });
    return groups;
  };

  if (loading) return <div className="election-page"><Spinner text="Loading election..." /></div>;

  if (!election) return (
    <div className="election-page">
      <div className="election-empty">
        <h1>SPE UDOM Elections</h1>
        <p>No active election at the moment. Check back later.</p>
      </div>
    </div>
  );

  const isClosed = election.status === 'closed';
  const isOpen = election.status === 'open';
  const candidateGroups = groupByPosition(election.candidates);
  const resultGroups = isClosed && results ? groupResultsByPosition(results.results) : {};

  return (
    <div className="election-page">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <section className="election-hero">
        <div className="election-hero-content">
          <h1>SPE UDOM Elections 2026</h1>
          <h2>{election.title}</h2>
          <div className="election-meta">
            <span className="election-status" style={{ background: statusColor[election.status] }}>
              {election.status.toUpperCase()}
            </span>
            <span className="election-deadline">
              🗓 Voting Deadline: {new Date(election.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {isClosed && results && (
              <span className="election-total">🗳 Total Votes: {results.total_votes}</span>
            )}
          </div>
          {election.description && <p className="election-desc">{election.description}</p>}
          {isOpen && !user && (
            <div className="login-notice">
              <a href="/login">Login</a> to cast your vote
            </div>
          )}
          {isOpen && user && (
            <div className="vote-progress">
              <span>Positions voted: {votedPositions.length} / {Object.keys(candidateGroups).length}</span>
              <div className="progress-bar">
                <div style={{ width: `${Object.keys(candidateGroups).length > 0 ? (votedPositions.length / Object.keys(candidateGroups).length) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Voting / Results */}
      <div className="election-body">
        {isOpen && (
          <>
            <div className="section-header-row">
              <h2>Cast Your Vote</h2>
              <p>Select one candidate per position</p>
            </div>
            {Object.entries(candidateGroups).map(([position, candidates]) => (
              <div key={position} className="position-section">
                <div className="position-header">
                  <h3>{position}</h3>
                  {votedPositions.includes(position) && <span className="position-voted">✓ Voted</span>}
                </div>
                <div className="candidates-grid">
                  {candidates.map(c => (
                    <CandidateCard
                      key={c.id}
                      candidate={c}
                      canVote={isOpen && !!user && !submitting}
                      hasVoted={votedPositions.includes(position)}
                      onVote={handleVote}
                      isClosed={false}
                    />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {isClosed && results && (
          <>
            <div className="section-header-row">
              <h2>Election Results</h2>
              <p>Final results — {results.total_votes} total votes cast</p>
            </div>
            {Object.entries(resultGroups).map(([position, candidates]) => {
              const winner = candidates.reduce((a, b) => a.vote_count > b.vote_count ? a : b, candidates[0]);
              return (
                <div key={position} className="position-section">
                  <div className="position-header">
                    <h3>{position}</h3>
                    <span className="winner-badge">🏆 Winner: {winner.name}</span>
                  </div>
                  <div className="candidates-grid">
                    {candidates.sort((a, b) => b.vote_count - a.vote_count).map(c => (
                      <div key={c.id} className={`candidate-card ${c.id === winner.id ? 'winner' : ''}`}>
                        <div className="candidate-photo">
                          {c.photo_url
                            ? <img src={c.photo_url} alt={c.name} />
                            : <div className="photo-placeholder">{c.name.charAt(0)}</div>}
                        </div>
                        <div className="candidate-info">
                          <h3>{c.name} {c.id === winner.id && '🏆'}</h3>
                          <span className="candidate-position">{c.position}</span>
                          <div className="result-bar-wrap">
                            <div className="result-bar" style={{ width: `${c.percentage}%`, background: c.id === winner.id ? '#00a86b' : '#0066cc' }} />
                            <span className="result-stats">{c.vote_count} votes ({c.percentage}%)</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {election.status === 'draft' && (
          <div className="upcoming-notice">
            <span>📋</span>
            <h3>Election Coming Soon</h3>
            <p>This election has not opened yet. Check back on {new Date(election.start_date).toLocaleDateString()}.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Election;
