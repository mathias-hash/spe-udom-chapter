import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './LiveChat.css';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';
const WS_BASE_URL = (process.env.REACT_APP_WS_BASE_URL || API_BASE_URL).replace(/^http/, 'ws');

const roleBadge = {
  admin:  { bg: '#f8d7da', color: '#842029' },
  member: { bg: '#d1e7dd', color: '#0a5c36' },
  guest:  { bg: '#fff3cd', color: '#856404' },
};

const LiveChat = () => {
  const { user } = useAuth();

  const [open, setOpen]           = useState(false);
  const [tab, setTab]             = useState('chat');
  const [connected, setConnected] = useState(false);
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [unread, setUnread]       = useState(0);
  const [guestName, setGuestName] = useState(localStorage.getItem('spe_chat_guest') || '');

  // History state
  const [history, setHistory]           = useState([]);
  const [histPage, setHistPage]         = useState(1);
  const [histTotal, setHistTotal]       = useState(0);
  const [histTotalPages, setHistTotalPages] = useState(1);
  const [histLoading, setHistLoading]   = useState(false);
  const [histSearch, setHistSearch]     = useState('');

  const socketRef = useRef(null);
  const bottomRef = useRef(null);
  const token     = () => localStorage.getItem('spe_access');

  // ── identity ────────────────────────────────────────────────
  const identity = user
    ? { sender_name: user.full_name, sender_role: user.role === 'admin' ? 'admin' : 'member' }
    : { sender_name: guestName || 'Guest User', sender_role: 'guest' };

  // ── WebSocket connect ────────────────────────────────────────
  useEffect(() => {
    // Load room key then open socket
    fetch(`${API_BASE_URL}/api/chat/support-room/`, {
      headers: user ? { Authorization: `Bearer ${token()}` } : {},
    })
      .then(r => r.json())
      .then(data => {
        setMessages(
          (data.messages || []).map(m => ({
            id: m.id,
            from: m.sender_name === identity.sender_name ? 'user' : 'other',
            sender_name: m.sender_name,
            sender_role: m.sender_role,
            sender_id: m.sender_id,
            text: m.content,
            time: m.created_at,
            saved: true,
          }))
        );

        const ws = new WebSocket(`${WS_BASE_URL}/ws/chat/${data.room_key}/`);
        socketRef.current = ws;

        ws.onopen  = () => setConnected(true);
        ws.onclose = () => setConnected(false);
        ws.onerror = () => setConnected(false);

        ws.onmessage = (event) => {
          const payload = JSON.parse(event.data);
          if (payload.type !== 'message') return;
          const m = payload.message;
          setMessages(prev => {
            // avoid duplicate if we already added it optimistically
            if (prev.some(x => x.id === m.id)) return prev;
            return [...prev, {
              id: m.id,
              from: m.sender_name === identity.sender_name ? 'user' : 'other',
              sender_name: m.sender_name,
              sender_role: m.sender_role,
              sender_id: m.sender_id,
              text: m.content,
              time: m.created_at,
              saved: true,
            }];
          });
          if (!open) setUnread(n => n + 1);
        };
      })
      .catch(() => {});

    return () => { socketRef.current?.close(); };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── scroll to bottom ─────────────────────────────────────────
  useEffect(() => {
    if (open && tab === 'chat')
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
  }, [messages, open, tab]);

  useEffect(() => { if (open) setUnread(0); }, [open]);

  // ── send message ─────────────────────────────────────────────
  const send = () => {
    const content = input.trim();
    if (!content) return;
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;

    if (!user) localStorage.setItem('spe_chat_guest', identity.sender_name);

    socketRef.current.send(JSON.stringify({
      content,
      sender_name: identity.sender_name,
      sender_role: identity.sender_role,
    }));
    setInput('');
  };

  // ── load history ─────────────────────────────────────────────
  const loadHistory = useCallback(async (p = 1) => {
    if (!user) return;
    setHistLoading(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/chat/history/?page=${p}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      setHistory(data.messages || []);
      setHistTotal(data.total || 0);
      setHistTotalPages(data.total_pages || 1);
      setHistPage(p);
    } catch {}
    setHistLoading(false);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && tab === 'history') loadHistory(1);
  }, [open, tab, loadHistory]);

  // ── delete message ───────────────────────────────────────────
  const deleteMsg = async (id) => {
    const res = await fetch(`${API_BASE_URL}/api/chat/messages/${id}/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) {
      setHistory(prev => prev.filter(m => m.id !== id));
      setHistTotal(t => t - 1);
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear ALL chat history? This cannot be undone.')) return;
    const res = await fetch(`${API_BASE_URL}/api/chat/clear/`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token()}` },
    });
    if (res.ok) { setHistory([]); setHistTotal(0); setHistTotalPages(1); }
  };

  // ── helpers ───────────────────────────────────────────────────
  const fmtTime = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtFull = iso => new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const filteredHistory = histSearch.trim()
    ? history.filter(m =>
        m.content.toLowerCase().includes(histSearch.toLowerCase()) ||
        m.sender_name.toLowerCase().includes(histSearch.toLowerCase())
      )
    : history;

  // ── render ────────────────────────────────────────────────────
  return (
    <div className="livechat-wrap">
      {open && (
        <div className="livechat-window">

          {/* Header */}
          <div className="livechat-header">
            <div className="livechat-avatar">S</div>
            <div className="livechat-header-info">
              <strong>SPE UDOM Support</strong>
              <span className="livechat-status">{connected ? 'Online' : 'Connecting...'}</span>
            </div>
            <button className="livechat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Tabs — only for authenticated users */}
          {user && (
            <div style={{ display: 'flex', borderBottom: '2px solid #eef2ff', background: '#f8faff' }}>
              {[['chat', '💬 Chat'], ['history', '🕐 History']].map(([t, label]) => (
                <button key={t} onClick={() => setTab(t)} style={{
                  flex: 1, padding: '8px 0', border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.82rem',
                  background: tab === t ? '#fff' : 'transparent',
                  color: tab === t ? '#0052a3' : '#888',
                  borderBottom: tab === t ? '2px solid #0052a3' : '2px solid transparent',
                  marginBottom: -2,
                }}>
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ── CHAT TAB ── */}
          {tab === 'chat' && (
            <>
              {/* Guest name input */}
              {!user && (
                <div style={{ padding: '8px 10px', borderBottom: '1px solid #eef2ff' }}>
                  <input value={guestName} onChange={e => setGuestName(e.target.value)}
                    placeholder="Your name (optional)"
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid #dde3f0', fontSize: '0.82rem', boxSizing: 'border-box' }} />
                </div>
              )}

              <div className="livechat-messages">
                {messages.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.82rem', marginTop: 24 }}>
                    Ask about membership, events, leadership, elections or contact.
                  </p>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`livechat-msg ${msg.from === 'user' ? 'user' : 'bot'}`}>
                    {msg.from !== 'user' && <div className="msg-avatar">S</div>}
                    <div className="msg-bubble">
                      {msg.from !== 'user' && (
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0052a3', display: 'block', marginBottom: 2 }}>
                          {msg.sender_name}
                        </span>
                      )}
                      <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{msg.text}</p>
                      <span className="msg-time">{fmtTime(msg.time)}</span>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="livechat-quick">
                {['Help', 'Membership', 'Events', 'Elections', 'Contact'].map(q => (
                  <button key={q} className="quick-btn" onClick={() => { setInput(q); }}>{q}</button>
                ))}
              </div>

              <div className="livechat-input-wrap">
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
                  placeholder={connected ? 'Type a message...' : 'Connecting...'}
                  rows={1} disabled={!connected} style={{ opacity: connected ? 1 : 0.6 }} />
                <button className="livechat-send" onClick={send} disabled={!input.trim() || !connected}>Send</button>
              </div>
            </>
          )}

          {/* ── HISTORY TAB ── */}
          {tab === 'history' && user && (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>

              {/* Toolbar */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #eef2ff', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <input value={histSearch} onChange={e => setHistSearch(e.target.value)}
                  placeholder="Search messages or sender..."
                  style={{ flex: 1, minWidth: 120, padding: '5px 8px', borderRadius: 6, border: '1px solid #dde3f0', fontSize: '0.78rem', outline: 'none' }} />
                <button onClick={() => loadHistory(histPage)}
                  style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#0066cc', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>
                  🔄
                </button>
                {user.role === 'admin' && (
                  <button onClick={clearAll}
                    style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#dc3545', color: '#fff', fontSize: '0.75rem', cursor: 'pointer' }}>
                    🗑 Clear All
                  </button>
                )}
              </div>

              <div style={{ padding: '4px 10px', fontSize: '0.72rem', color: '#888', borderBottom: '1px solid #f0f0f0' }}>
                {histTotal} message{histTotal !== 1 ? 's' : ''} total
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
                {histLoading ? (
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.82rem', marginTop: 20 }}>Loading...</p>
                ) : filteredHistory.length === 0 ? (
                  <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.82rem', marginTop: 20 }}>No messages found.</p>
                ) : (
                  filteredHistory.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10, padding: '8px', background: '#f8faff', borderRadius: 8, border: '1px solid #eef2ff' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#1a1a2e' }}>{msg.sender_name}</strong>
                          <span style={{
                            background: roleBadge[msg.sender_role]?.bg || '#eee',
                            color: roleBadge[msg.sender_role]?.color || '#333',
                            padding: '1px 7px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700,
                          }}>{msg.sender_role}</span>
                          <span style={{ fontSize: '0.68rem', color: '#aaa', marginLeft: 'auto' }}>{fmtFull(msg.created_at)}</span>
                        </div>
                        <p style={{ fontSize: '0.82rem', color: '#333', margin: 0, wordBreak: 'break-word', whiteSpace: 'pre-line' }}>{msg.content}</p>
                      </div>
                      {(user.role === 'admin' || msg.sender_id === user.id) && (
                        <button onClick={() => deleteMsg(msg.id)} title="Delete"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc3545', fontSize: '0.85rem', flexShrink: 0, padding: '2px 4px' }}>
                          🗑
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {histTotalPages > 1 && !histSearch && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 4, padding: '8px', borderTop: '1px solid #eef2ff', flexWrap: 'wrap' }}>
                  <button disabled={histPage === 1} onClick={() => loadHistory(histPage - 1)}
                    style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #dde3f0', background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>←</button>
                  {Array.from({ length: histTotalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => loadHistory(p)} style={{
                      padding: '3px 8px', borderRadius: 5, border: '1px solid #dde3f0',
                      background: histPage === p ? '#0052a3' : '#fff',
                      color: histPage === p ? '#fff' : '#333',
                      cursor: 'pointer', fontSize: '0.75rem',
                    }}>{p}</button>
                  ))}
                  <button disabled={histPage === histTotalPages} onClick={() => loadHistory(histPage + 1)}
                    style={{ padding: '3px 8px', borderRadius: 5, border: '1px solid #dde3f0', background: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>→</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <button className="livechat-toggle" onClick={() => setOpen(o => !o)}>
        {open ? '✕' : 'Chat'}
        {!open && unread > 0 && <span className="livechat-badge">{unread}</span>}
      </button>
    </div>
  );
};

export default LiveChat;
