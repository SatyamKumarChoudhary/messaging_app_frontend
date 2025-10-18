import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectSocket, disconnectSocket } from '../services/socket';

function Home() {
  const [receiver, setReceiver] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [countdown, setCountdown] = useState(15);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  // Socket.io connection
  useEffect(() => {
    const socket = connectSocket(token);
    
    socket.on('connect', () => {
      console.log('✅ Connected to Socket.io');
    });
    
    socket.on('new_message', (data) => {
      console.log('📨 New message:', data);
      setMessages(prev => [...prev, data]);
      
      socket.emit('message_delivered', {
        message_id: data.message_id
      });
    });
    
    return () => {
      disconnectSocket();
    };
  }, [token]);

  // 15-second countdown timer
  useEffect(() => {
    if (viewingMessage) {
      setCountdown(15);
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            closeMessageViewer();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [viewingMessage]);

  const handleLogout = () => {
    disconnectSocket();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await axios.post(
        'http://localhost:3001/api/messages/send',
        { receiver_username: receiver, text: message },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setSuccess('Message sent!');
      setReceiver('');
      setMessage('');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send');
    } finally {
      setLoading(false);
    }
  };

  const openMessageViewer = (msg) => {
    setViewingMessage(msg);
  };

  const closeMessageViewer = () => {
    if (viewingMessage) {
      setMessages(prev => prev.filter(m => m.message_id !== viewingMessage.message_id));
      setViewingMessage(null);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>📨 Welcome, {user.username}!</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* Send Message */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📤 Send Message</h2>
        <form onSubmit={handleSendMessage} style={styles.form}>
          <input
            type="text"
            placeholder="Receiver username"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            required
            style={styles.input}
          />
          <textarea
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows="3"
            style={styles.textarea}
          />
          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
          <button type="submit" disabled={loading} style={styles.sendBtn}>
            {loading ? 'Sending...' : 'Send Message'}
          </button>
        </form>
      </div>

      {/* Received Messages - Chat List */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>
          📬 Messages ({messages.length})
        </h2>
        
        {messages.length === 0 ? (
          <p style={styles.noMessages}>No new messages</p>
        ) : (
          <div style={styles.chatList}>
            {messages.map((msg) => (
              <div key={msg.message_id} style={styles.chatItem}>
                <div style={styles.chatInfo}>
                  <div style={styles.avatar}>
                    {msg.sender_name.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.chatDetails}>
                    <div style={styles.senderName}>{msg.sender_name}</div>
                    <div style={styles.messagePreview}>
                      {msg.text.substring(0, 30)}
                      {msg.text.length > 30 ? '...' : ''}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => openMessageViewer(msg)}
                  style={styles.viewBtn}
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Viewer Modal */}
      {viewingMessage && (
        <div style={styles.modalOverlay} onClick={closeMessageViewer}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                From: {viewingMessage.sender_name}
              </h3>
              <div style={styles.countdown}>
                ⏱️ {countdown}s
              </div>
            </div>
            
            <div style={styles.modalBody}>
              <p style={styles.messageText}>{viewingMessage.text}</p>
            </div>
            
            <div style={styles.modalFooter}>
              <small style={styles.messageTime}>
                {new Date(viewingMessage.created_at).toLocaleString()}
              </small>
            </div>
            
            <button onClick={closeMessageViewer} style={styles.closeBtn}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  title: {
    color: '#333',
    fontSize: '24px',
    margin: 0
  },
  logoutBtn: {
    padding: '10px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: 'white',
    padding: '25px',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    maxWidth: '600px',
    margin: '0 auto 20px'
  },
  sectionTitle: {
    color: '#333',
    marginBottom: '20px',
    fontSize: '18px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px'
  },
  textarea: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontFamily: 'Arial',
    resize: 'vertical'
  },
  sendBtn: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  },
  error: {
    color: 'red',
    fontSize: '14px',
    margin: 0
  },
  success: {
    color: 'green',
    fontSize: '14px',
    margin: 0
  },
  noMessages: {
    textAlign: 'center',
    color: '#999',
    padding: '20px'
  },
  chatList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  chatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  chatInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold'
  },
  chatDetails: {
    flex: 1
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: '16px',
    color: '#333',
    marginBottom: '4px'
  },
  messagePreview: {
    color: '#666',
    fontSize: '14px'
  },
  viewBtn: {
    padding: '8px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '90%',
    maxWidth: '500px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef'
  },
  modalTitle: {
    margin: 0,
    fontSize: '20px',
    color: '#333'
  },
  countdown: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#dc3545',
    backgroundColor: '#ffe6e6',
    padding: '8px 15px',
    borderRadius: '20px'
  },
  modalBody: {
    padding: '20px 0',
    minHeight: '100px'
  },
  messageText: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#333',
    margin: 0,
    wordBreak: 'break-word'
  },
  modalFooter: {
    paddingTop: '15px',
    borderTop: '1px solid #e9ecef',
    marginBottom: '15px'
  },
  messageTime: {
    color: '#999',
    fontSize: '12px'
  },
  closeBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  }
};

export default Home;