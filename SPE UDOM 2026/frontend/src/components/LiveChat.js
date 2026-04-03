import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import './LiveChat.css';

const API = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
const POLL_MS = 4000;

const LiveChat = () => {
  const { user } = useAuth();

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [status, setStatus]     = useState('connecting'); // connecting | online | offline
  const [unread, setUnread]     = useState(0);

  const openRef    = useRef(false);
  const lastIdRef  = useRef(0);
  const pollTimer  = useRef(null);
  const retryTimer = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const authHeader = useCallback(() => {
    const t = localStorage.getItem('spe_access');
    return t ? { Authorization: `Bearer ${t}` } : {};
  }, []);

  const senderName = user ? user.full_name : 'Guest';
  const senderRole = user ? (user.role === 'admin' ? 'admin' : 'member') : 'guest';

  // ── fetch room & messages ────────────────────────────────────
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/chat/support-room/`, {
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!mountedRef.current) return;

      const mapped = (data.messages || []).map(m => ({
        id: m.id,
        own: m.sender_name === senderName,
        name: m.sender_name,
        text: m.content,
        time: m.created_at,
      }));

      setMessages(mapped);
      setStatus('online');
      if (mapped.length) lastIdRef.current = mapped[mapped.length - 1].id;

      // start polling
      clearInterval(pollTimer.current);
      pollTimer.current = setInterval(async () => {
        try {
          const r = await fetch(`${API}/api/chat/support-room/`, {
            headers: { ...authHeader() },
          });
          if (!r.ok || !mountedRef.current) return;
          const d = await r.json();
          const all = (d.messages || []).map(m => ({
            id: m.id,
            own: m.sender_name === senderName,
            name: m.sender_name,
            text: m.content,
            time: m.created_at,
          }));
          const fresh = all.filter(m => m.id > lastIdRef.current);
          if (fresh.length) {
            setMessages(prev => [...prev, ...fresh]);
            lastIdRef.current = fresh[fresh.length - 1].id;
            if (!openRef.current) setUnread(n => n + fresh.length);
          }
        } catch {}
      }, POLL_MS);

    } catch (e) {
      if (!mountedRef.current) return;
      setStatus('offline');
      clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(fetchRoom, 5000);
    }
  }, [user, senderName, authHeader]); // eslint-disable-line

  useEffect(() => {
    fetchRoom();
    return () => {
      clearInterval(pollTimer.current);
      clearTimeout(retryTimer.current);
    };
  }, [fetchRoom]);

  useEffect(() => { openRef.current = open; if (open) setUnread(0); }, [open]);

  // ── scroll ───────────────────────────────────────────────────
  const bottomRef = useRef(null);
  useEffect(() => {
    if (open) setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
  }, [messages, open]);

  // ── send ─────────────────────────────────────────────────────
  const send = async () => {
    const content = input.trim();
    if (!content || sending || status !== 'online') return;
    setSending(true);
    setInput('');
    try {
      const res = await fetch(`${API}/api/chat/send/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({ content, sender_name: senderName, sender_role: senderRole }),
      });
      if (res.ok) {
        const data = await res.json();
        const add = [];
        if (data.user_message) {
          add.push({ id: data.user_message.id, own: true, name: senderName, text: data.user_message.content, time: data.user_message.created_at });
        }
        if (data.assistant_message) {
          add.push({ id: data.assistant_message.id, own: false, name: data.assistant_message.sender_name, text: data.assistant_message.content, time: data.assistant_message.created_at });
        }
        if (add.length) {
          setMessages(prev => [...prev, ...add]);
          lastIdRef.current = add[add.length - 1].id;
        }
      }
    } catch {}
    setSending(false);
  };

  const fmt = iso => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="livechat-wrap">
      {open && (
        <div className="livechat-window">
          <div className="livechat-header">
            <div className="livechat-avatar">S</div>
            <div className="livechat-header-info">
              <strong>SPE UDOM Support</strong>
              <span className="livechat-status" style={{ color: status === 'online' ? '#90ee90' : '#ffa07a' }}>
                {status === 'connecting' ? 'Connecting...' : status === 'online' ? 'Online' : 'Offline — retrying...'}
              </span>
            </div>
            <button className="livechat-close" onClick={() => setOpen(false)}>✕</button>
          </div>

          <div className="livechat-messages">
            {messages.length === 0 && status === 'online' && (
              <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.82rem', marginTop: 24 }}>
                Ask about membership, events, leadership, elections or contact.
              </p>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={`livechat-msg ${msg.own ? 'user' : 'bot'}`}>
                {!msg.own && <div className="msg-avatar">S</div>}
                <div className="msg-bubble">
                  {!msg.own && msg.name !== 'SPE Assistant' && <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#0052a3', display: 'block', marginBottom: 2 }}>{msg.name}</span>}
                  <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{msg.text}</p>
                  <span className="msg-time">{fmt(msg.time)}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="livechat-quick">
            {['Help', 'Membership', 'Events', 'Elections', 'Contact'].map(q => (
              <button key={q} className="quick-btn" onClick={() => {
                setInput(q);
                setTimeout(() => {
                  const content = q.trim();
                  if (!content || status !== 'online') return;
                  setInput('');
                  fetch(`${API}/api/chat/send/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeader() },
                    body: JSON.stringify({ content, sender_name: senderName, sender_role: senderRole }),
                  }).then(r => r.ok ? r.json() : null).then(data => {
                    if (!data) return;
                    const add = [];
                    if (data.user_message) add.push({ id: data.user_message.id, own: true, name: senderName, text: data.user_message.content, time: data.user_message.created_at });
                    if (data.assistant_message) add.push({ id: data.assistant_message.id, own: false, name: data.assistant_message.sender_name, text: data.assistant_message.content, time: data.assistant_message.created_at });
                    if (add.length) { setMessages(prev => [...prev, ...add]); lastIdRef.current = add[add.length - 1].id; }
                  }).catch(() => {});
                }, 0);
              }}>{q}</button>
            ))}
          </div>

          <div className="livechat-input-wrap">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={status === 'online' ? 'Type a message...' : 'Waiting for connection...'}
              rows={1}
              disabled={sending || status !== 'online'}
              style={{ opacity: status === 'online' ? 1 : 0.5 }}
            />
            <button className="livechat-send" onClick={send} disabled={!input.trim() || sending || status !== 'online'}>
              {sending ? '...' : 'Send'}
            </button>
          </div>
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
