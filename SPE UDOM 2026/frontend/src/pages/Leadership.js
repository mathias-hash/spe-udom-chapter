import React, { useEffect, useMemo, useState } from 'react';
import Spinner from '../components/Spinner';
import { API_BASE } from '../utils/api';

const defaultLeaders = [
  { name: 'To Be Announced', position: 'PRESIDENT', image_url: '' },
  { name: 'To Be Announced', position: 'VICE PRESIDENT', image_url: '' },
  { name: 'To Be Announced', position: 'GENERAL SECRETARY', image_url: '' },
  { name: 'To Be Announced', position: 'TREASURER', image_url: '' },
  { name: 'To Be Announced', position: 'MEMBERSHIP CHAIR PERSON', image_url: '' },
  { name: 'To Be Announced', position: 'PROGRAM CHAIR PERSON', image_url: '' },
  { name: 'To Be Announced', position: 'COMMUNICATIONS AND OUTREACH CHAIRPERSON', image_url: '' },
  { name: 'To Be Announced', position: 'SOCIAL ACTIVITIES CHAIRPERSON', image_url: '' },
  { name: 'To Be Announced', position: 'WEB MASTER', image_url: '' },
  { name: 'To Be Announced', position: 'TECHNICAL OFFICER', image_url: '' },
  { name: 'To Be Announced', position: 'FACULTY ADVISOR', image_url: '' },
];

const createPlaceholder = (position) => {
  const initials = position.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0052a3"/><stop offset="100%" stop-color="#12a4d9"/>
    </linearGradient></defs>
    <rect width="320" height="320" fill="url(#bg)" rx="0"/>
    <circle cx="160" cy="120" r="56" fill="rgba(255,255,255,0.22)"/>
    <path d="M82 258c14-44 53-70 78-70s64 26 78 70" fill="rgba(255,255,255,0.22)"/>
    <text x="160" y="294" text-anchor="middle" font-family="Inter,Arial,sans-serif" font-size="36" font-weight="700" fill="#ffffff">${initials}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const Leadership = () => {
  const [members, setMembers] = useState(defaultLeaders);
  const [loading, setLoading] = useState(true);
  const [activeYear, setActiveYear] = useState('');
  const [years, setYears] = useState([]);

  // Load available years once, then set activeYear to the last (most recent)
  useEffect(() => {
    fetch(`${API_BASE}/leadership/years/`)
      .then(r => r.json())
      .then(d => {
        const ys = d.years || [];
        setYears(ys);
        if (ys.length > 0) setActiveYear(ys[ys.length - 1]);
      })
      .catch(() => {});
  }, []);

  // Load members whenever activeYear changes
  useEffect(() => {
    if (!activeYear) return;
    let ignore = false;
    setLoading(true);
    fetch(`${API_BASE}/leadership/?year=${encodeURIComponent(activeYear)}`)
      .then(r => r.json())
      .then(data => {
        if (!ignore) {
          const map = new Map((data.members || []).map(m => [m.position, m]));
          setMembers(defaultLeaders.map(d => ({ ...d, ...(map.get(d.position) || {}) })));
        }
      })
      .catch(() => {})
      .finally(() => { if (!ignore) setLoading(false); });
    return () => { ignore = true; };
  }, [activeYear]);

  const cards = useMemo(() =>
    members.map(l => ({ ...l, imageSrc: l.image_url || createPlaceholder(l.position) })),
    [members]
  );

  return (
    <div className="page-container leadership-page" style={{ padding: 0 }}>
      <div className="leadership-header">
        <span className="section-tag" style={{ color: 'rgba(255,255,255,0.7)' }}>Our Team</span>
        <h1>Chapter Leadership {activeYear && <span>({activeYear})</span>}</h1>
        <p>Meet the SPE UDOM Chapter executive officers and leadership team {activeYear && <span>{activeYear}</span>}</p>

        {/* Year dropdown */}
        {years.length > 0 && (
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <select
              value={activeYear}
              onChange={e => setActiveYear(e.target.value)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: 'none',
                background: '#fff',
                color: '#0052a3',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                outline: 'none',
                minWidth: 160,
              }}
            >
              {years.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading
        ? <Spinner text="Loading leadership..." />
        : <div className="leadership-grid">
            {cards.map(leader => (
              <article key={leader.position} className="leader-card">
                <img className="leader-image" src={leader.imageSrc} alt={leader.position} />
                <div className="leader-content">
                  <h2>{leader.name}</h2>
                  <span className="leader-role">{leader.position}</span>
                </div>
              </article>
            ))}
          </div>
      }
    </div>
  );
};

export default Leadership;
