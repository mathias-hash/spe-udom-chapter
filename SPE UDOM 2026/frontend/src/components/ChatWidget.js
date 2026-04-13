import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/api';
import './ChatWidget.css';

const apiBaseUrl = API_BASE_URL;

// Construct WebSocket URL correctly
const getWsBaseUrl = () => {
  if (process.env.REACT_APP_WS_BASE_URL) {
    return process.env.REACT_APP_WS_BASE_URL;
  }
  // Parse the API base URL properly
  try {
    const url = new URL(apiBaseUrl);
    const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${url.host}`;
  } catch (e) {
    console.error('Invalid API base URL:', apiBaseUrl);
    return 'ws://localhost:8000';
  }
};

const wsBaseUrl = getWsBaseUrl();

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [guestName, setGuestName] = useState(localStorage.getItem('spe_chat_guest_name') || '');
  const socketRef = useRef(null);
  const listRef = useRef(null);

  const identity = useMemo(() => {
    if (user) {
      return {
        sender_name: user.full_name,
        sender_role: user.role === 'admin' ? 'admin' : 'member',
      };
    }

    const fallbackName = guestName || 'Guest User';
    return {
      sender_name: fallbackName,
      sender_role: 'guest',
    };
  }, [guestName, user]);

  useEffect(() => {
    let ignore = false;

    const loadRoom = async () => {
      try {
        const response = await fetch(`${apiBaseUrl}/api/chat/support-room/`, {
          credentials: 'include',
        });
        const data = await response.json();
        if (!ignore) {
          setRoom(data);
          setMessages(data.messages || []);
          if (!guestName && data.sender_role === 'guest') {
            setGuestName(data.display_name || 'Guest User');
          }
        }
      } catch (error) {
        if (!ignore) {
          setRoom(null);
        }
      }
    };

    loadRoom();

    return () => {
      ignore = true;
    };
  }, [guestName]);

  useEffect(() => {
    if (!room?.room_key) {
      return undefined;
    }

    const socket = new WebSocket(`${wsBaseUrl}/ws/chat/${room.room_key}/`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connected:', wsBaseUrl);
      setIsConnected(true);
    };
    socket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setIsConnected(false);
    };
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data);
      if (payload.type !== 'message') {
        return;
      }

      setMessages((current) => [...current, payload.message]);
      if (!isOpen) {
        setUnreadCount((current) => current + 1);
      }
    };

    return () => {
      socket.close();
    };
  }, [isOpen, room]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const content = draft.trim();
    if (!content || !socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    if (!user) {
      localStorage.setItem('spe_chat_guest_name', identity.sender_name);
    }

    socketRef.current.send(
      JSON.stringify({
        content,
        sender_name: identity.sender_name,
        sender_role: identity.sender_role,
      })
    );
    setDraft('');
  };

  return (
    <>
      {isOpen && (
        <div className="chat-widget-panel">
          <div className="chat-widget-header">
            <div>
              <strong>SPE UDOM Live Chat</strong>
              <span>{isConnected ? 'Support online' : 'Connecting...'}</span>
            </div>
            <button type="button" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          {!user && (
            <div className="chat-guest-row">
              <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Your name" />
            </div>
          )}

          <div className="chat-widget-messages" ref={listRef}>
            {messages.length === 0 && (
              <div className="chat-empty-state">Ask about membership, events, leadership, elections, publications, or contact details.</div>
            )}
            {messages.map(message => (
              <div key={`${message.id}-${message.created_at}`} className={`chat-bubble ${message.sender_name === identity.sender_name ? 'own' : ''}`}>
                <strong>{message.sender_name}</strong>
                <p>{message.content}</p>
              </div>
            ))}
          </div>

          <div className="chat-widget-input">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
            />
            <button type="button" onClick={handleSend}>➤</button>
          </div>
        </div>
      )}

      <button
        type="button"
        className="chat-widget-launcher"
        onClick={() => { setIsOpen(o => !o); setUnreadCount(0); }}
      >
        <span className="chat-logo">💬</span>
        {unreadCount > 0 && <span className="chat-badge">{unreadCount}</span>}
      </button>
    </>
  );
};

export default ChatWidget;
