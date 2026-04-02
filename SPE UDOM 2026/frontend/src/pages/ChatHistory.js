import React, { useState, useEffect } from 'react';
import '../components/ChatWidget.css';

const ChatHistory = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/chat/history/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }
        
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, []);

  if (loading) {
    return <div className="loading">Loading chat history...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  return (
    <div className="chat-history-container">
      <h2>Chat History</h2>
      {messages.length === 0 ? (
        <p>No messages yet.</p>
      ) : (
        <div className="messages-list">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.sender_type || 'user'}`}>
              <div className="message-sender">
                {msg.sender_type === 'assistant' ? 'Assistant' : 'You'}
              </div>
              <div className="message-content">{msg.content}</div>
              <div className="message-timestamp">
                {new Date(msg.created_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatHistory;
