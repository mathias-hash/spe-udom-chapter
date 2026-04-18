import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';
import './LiveChat.css';

const API = API_BASE_URL.replace(/\/$/, '');
const POLL_MS = 100000;
const TYPING_MESSAGE_ID = 'assistant-typing';

const areLikelyDuplicateMessages = (existing, incoming) => {
  if (!existing || !incoming) return false;
  if (existing.id === incoming.id) return true;
  if (existing.own || incoming.own) return false;
  if (existing.name !== incoming.name || existing.text !== incoming.text) return false;

  const existingTime = existing.time ? new Date(existing.time).getTime() : 0;
  const incomingTime = incoming.time ? new Date(incoming.time).getTime() : 0;
  return Math.abs(existingTime - incomingTime) < 10000;
};

const mergeMessages = (current, incoming) => {
  const next = [...current];

  incoming.forEach(message => {
    if (!message) return;

    if (next.some(existing => existing.id === message.id)) {
      return;
    }

    const lastRealMessage = [...next].reverse().find(item => item.id !== TYPING_MESSAGE_ID);
    if (areLikelyDuplicateMessages(lastRealMessage, message)) {
      return;
    }

    next.push(message);
  });

  return next;
};

const mapMessage = (message, senderName) => ({
  id: message.id,
  own: message.sender_name === senderName,
  name: message.sender_name,
  text: message.content,
  time: message.created_at,
});

const LiveChat = () => {
  const { user } = useAuth();

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState('connecting');
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);
  const [activeQuickReply, setActiveQuickReply] = useState('');
  const [unread, setUnread] = useState(0);

  const retryCountRef = useRef(0);
  const openRef = useRef(false);
  const lastIdRef = useRef(0);
  const pollTimer = useRef(null);
  const retryTimer = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const authHeader = useCallback(() => {
    const token = localStorage.getItem('spe_access');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, []);

  const senderName = user ? user.full_name : 'Guest';
  const senderRole = user ? (user.role === 'admin' ? 'admin' : 'member') : 'guest';

  const stopPolling = useCallback(() => {
    clearInterval(pollTimer.current);
    clearTimeout(retryTimer.current);
    pollTimer.current = null;
    retryTimer.current = null;
  }, []);

  const fetchRoom = useCallback(async () => {
    if (!mountedRef.current || !openRef.current) return;

    try {
      const res = await fetch(`${API}/api/chat/support-room/`, {
        headers: { ...authHeader() },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!mountedRef.current) return;

      const mapped = (data.messages || []).map(message => mapMessage(message, senderName));
      setMessages(() => mergeMessages([], mapped));
      setStatus('online');
      retryCountRef.current = 0;

      if (mapped.length) {
        lastIdRef.current = mapped[mapped.length - 1].id;
      }

      clearInterval(pollTimer.current);
      pollTimer.current = setInterval(async () => {
        if (!mountedRef.current || !openRef.current) return;
        try {
          const response = await fetch(`${API}/api/chat/support-room/`, {
            headers: { ...authHeader() },
          });
          if (!response.ok || !mountedRef.current) return;

          const roomData = await response.json();
          const all = (roomData.messages || []).map(message => mapMessage(message, senderName));
          const fresh = all.filter(message => message.id > lastIdRef.current);

          if (fresh.length) {
            setMessages(previous => mergeMessages(previous, fresh));
            lastIdRef.current = fresh[fresh.length - 1].id;
            if (!openRef.current) {
              setUnread(count => count + fresh.length);
            }
          }
        } catch {
          // Ignore poll failures and keep the existing state.
        }
      }, POLL_MS);
    } catch {
      if (!mountedRef.current) return;

      retryCountRef.current += 1;
      setStatus(retryCountRef.current <= 4 ? 'waking' : 'offline');

      const delay = Math.min(5000 * Math.pow(1.5, retryCountRef.current - 1), 30000);
      clearTimeout(retryTimer.current);
      retryTimer.current = setTimeout(() => {
        if (openRef.current) {
          fetchRoom();
        }
      }, delay);
    }
  }, [authHeader, senderName]);

  useEffect(() => {
    openRef.current = open;

    if (open) {
      setStatus('connecting');
      fetchRoom();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [open, fetchRoom, stopPolling]);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setUnread(0);
    }
  }, [open]);

  const bottomRef = useRef(null);
  const renderedMessages = useMemo(() => (
    isAssistantTyping
      ? [
          ...messages,
          {
            id: TYPING_MESSAGE_ID,
            own: false,
            name: 'SPE Assistant',
            text: '',
            time: new Date().toISOString(),
            typing: true,
          },
        ]
      : messages
  ), [isAssistantTyping, messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60);
    }
  }, [renderedMessages, open]);

  const sendMessage = useCallback(async content => {
    const trimmed = content.trim();
    if (!trimmed || sending || status !== 'online') return;

    setSending(true);
    setIsAssistantTyping(true);

    try {
      const res = await fetch(`${API}/api/chat/send/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify({
          content: trimmed,
          sender_name: senderName,
          sender_role: senderRole,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const incoming = [];

        if (data.user_message) {
          incoming.push(mapMessage(data.user_message, senderName));
        }

        if (data.assistant_message) {
          incoming.push(mapMessage(data.assistant_message, senderName));
        }

        if (incoming.length) {
          setMessages(previous => mergeMessages(previous, incoming));
          lastIdRef.current = incoming[incoming.length - 1].id;
        }
      }
    } catch {
      // Keep the current UI stable if the request fails.
    } finally {
      setSending(false);
      setIsAssistantTyping(false);
      setActiveQuickReply('');
    }
  }, [authHeader, senderName, senderRole, sending, status]);

  const send = async () => {
    const content = input.trim();
    if (!content) return;

    setInput('');
    await sendMessage(content);
  };

  const handleQuickReply = async quickReply => {
    if (sending || status !== 'online') return;
    setActiveQuickReply(quickReply);
    setInput('');
    await sendMessage(quickReply);
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
                {status === 'connecting'
                  ? 'Connecting...'
                  : status === 'online'
                    ? 'Online'
                    : status === 'waking'
                      ? 'Starting up, please wait...'
                      : 'Offline - retrying...'}
              </span>
            </div>
            <button className="livechat-close" onClick={() => setOpen(false)} aria-label="Close chat">&times;</button>
          </div>

          <div className="livechat-messages">
            {messages.length === 0 && status === 'online' && (
              <p className="livechat-empty-state">
                Ask about membership, events, leadership, elections or contact.
              </p>
            )}

            {renderedMessages.map(message => (
              <div key={message.id} className={`livechat-msg ${message.own ? 'user' : 'bot'}`}>
                {!message.own && <div className="msg-avatar">S</div>}
                <div className={`msg-bubble ${message.typing ? 'typing' : ''}`}>
                  {!message.own && !message.typing && message.name !== 'SPE Assistant' && (
                    <span className="msg-name">{message.name}</span>
                  )}

                  {message.typing ? (
                    <>
                      <span></span>
                      <span></span>
                      <span></span>
                    </>
                  ) : (
                    <>
                      <p className="msg-text">{message.text}</p>
                      <span className="msg-time">{fmt(message.time)}</span>
                    </>
                  )}
                </div>
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          <div className="livechat-quick">
            {['Help', 'Membership', 'Events', 'Elections', 'Contact'].map(quickReply => (
              <button
                key={quickReply}
                className={`quick-btn ${activeQuickReply === quickReply ? 'active' : ''}`}
                onClick={() => handleQuickReply(quickReply)}
                disabled={sending || status !== 'online'}
              >
                {activeQuickReply === quickReply && sending ? 'Sending...' : quickReply}
              </button>
            ))}
          </div>

          <div className="livechat-input-wrap">
            <textarea
              value={input}
              onChange={event => setInput(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  send();
                }
              }}
              placeholder={status === 'online'
                ? (isAssistantTyping ? 'Assistant is replying...' : 'Type a message...')
                : 'Waiting for connection...'}
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

      <button className="livechat-toggle" onClick={() => setOpen(current => !current)}>
        {open ? 'Close' : 'Chat'}
        {!open && unread > 0 && <span className="livechat-badge">{unread}</span>}
      </button>
    </div>
  );
};

export default LiveChat;
