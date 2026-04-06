import React, { useEffect, useState } from 'react';
import Spinner from '../components/Spinner';
import { API_BASE } from '../utils/api';
import './Publication.css';

const ITEMS_PER_PAGE = 6;

const Publication = () => {
  const [pubs, setPubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ search: query, page, page_size: ITEMS_PER_PAGE });
    fetch(`${API_BASE}/publications/?${params}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('spe_access')}` }
    })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) { setPubs(d); setTotalPages(1); }
        else { setPubs(d.results || []); setTotalPages(d.total_pages || 1); }
      })
      .catch(() => setPubs([]))
      .finally(() => setLoading(false));
  }, [query, page]);

  const handleSearch = e => { e.preventDefault(); setQuery(search); setPage(1); };

  return (
    <div className="pub-page">
      <section className="pub-hero">
        <span className="section-tag" style={{ color: 'rgba(255,255,255,0.7)' }}>Knowledge Hub</span>
        <h1>Publications</h1>
        <p>Research papers, articles, and technical resources from SPE UDOM Chapter</p>
      </section>

      <div className="pub-body">
        <form className="search-bar" onSubmit={handleSearch}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search publications..." />
          <button type="submit">🔍 Search</button>
          {query && <button type="button" onClick={() => { setSearch(''); setQuery(''); setPage(1); }}>✕ Clear</button>}
        </form>

        {loading
          ? <Spinner text="Loading publications..." />
          : pubs.length === 0
            ? <div className="empty-state"><span>📄</span><p>No publications found{query ? ` for "${query}"` : ''}.</p></div>
            : <>
                <div className="pub-grid">
                  {pubs.map(p => (
                    <div key={p.id} className="pub-card">
                      <div className="pub-icon">📄</div>
                      <div className="pub-content">
                        <h3>{p.title}</h3>
                        <p>{p.content?.substring(0, 120)}...</p>
                        <div className="pub-meta">
                          <span>By {p.published_by_name}</span>
                          <span>{new Date(p.created_at).toLocaleDateString()}</span>
                        </div>
                        {p.file_url && (
                          <a
                            href={p.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="pub-download"
                          >
                            ⬇ Download
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                      <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
                  </div>
                )}
              </>
        }
      </div>
    </div>
  );
};

export default Publication;
