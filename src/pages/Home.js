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

  // Phone input formatter (auto-adds +91 prefix)
  const handleReceiverChange = (e) => {
    let value = e.target.value;
    
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    
    // Auto-add +91 prefix if user starts typing
    if (value.length > 0 && !value.startsWith('91')) {
      value = '91' + value;
    }
    
    // Limit to 12 digits (91 + 10 digits)
    if (value.length > 12) {
      value = value.slice(0, 12);
    }
    
    // Add + prefix for display
    const formattedValue = value.length > 0 ? '+' + value : '';
    
    setReceiver(formattedValue);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validate phone format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(receiver)) {
      setError('Invalid phone number. Must be 10 digits starting with 6-9');
      setLoading(false);
      return;
    }

    // Prevent sending to self
    if (receiver === user.phone) {
      setError('Cannot send message to yourself');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        'http://localhost:3001/api/messages/send',
        { receiver_phone: receiver, text: message },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      // Show appropriate success message
      if (response.data.receiver_status === 'unregistered') {
        setSuccess(`Message sent! ${receiver} will receive it when they register.`);
      } else {
        setSuccess(response.data.delivered 
          ? 'Message sent and delivered!' 
          : 'Message sent! User will receive when online.'
        );
      }

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
        <div>
          <h1 style={styles.title}>📨 Welcome, {user.username || user.phone}!</h1>
          <p style={styles.userPhone}>Your number: {user.phone}</p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>

      {/* Send Message */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📤 Send Message</h2>
        <form onSubmit={handleSendMessage} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Receiver's Phone Number</label>
            <input
              type="tel"
              placeholder="+919876543210"
              value={receiver}
              onChange={handleReceiverChange}
              required
              style={styles.input}
              maxLength="13"
            />
            <small style={styles.hint}>
              Works even if they haven't registered yet!
            </small>
          </div>
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
              <div key={msg.message_id} style={styles.chatItem} onClick={() => openMessageViewer(msg)}>
                <div style={styles.chatInfo}>
                  <div style={styles.avatar}>
                    {(msg.sender_name || msg.sender_phone).charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.chatDetails}>
                    <div style={styles.senderName}>
                      {msg.sender_name || msg.sender_phone}
                    </div>
                    <div style={styles.senderPhone}>
                      {msg.sender_phone}
                    </div>
                    <div style={styles.messagePreview}>
                      {msg.text.substring(0, 30)}
                      {msg.text.length > 30 ? '...' : ''}
                    </div>
                  </div>
                </div>
                <div style={styles.viewBtn}>👁️ View</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Viewer Modal (15-second self-destruct) */}
      {viewingMessage && (
        <div style={styles.modal} onClick={closeMessageViewer}>
          <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                From: {viewingMessage.sender_name || viewingMessage.sender_phone}
              </h3>
              <div style={styles.countdown}>
                ⏱️ {countdown}s
              </div>
            </div>
            <p style={styles.modalPhone}>{viewingMessage.sender_phone}</p>
            <div style={styles.messageBody}>
              {viewingMessage.text}
            </div>
            <button onClick={closeMessageViewer} style={styles.closeBtn}>
              Close Now
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
    fontFamily: 'Arial, sans-serif',
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    marginBottom: '20px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  title: {
    margin: 0,
    color: '#333'
  },
  userPhone: {
    margin: '5px 0 0 0',
    fontSize: '14px',
    color: '#666'
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
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    marginBottom: '20px'
  },
  sectionTitle: {
    marginTop: 0,
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#555'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none'
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px'
  },
  textarea: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none',
    resize: 'vertical'
  },
  sendBtn: {
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    color: 'red',
    fontSize: '14px',
    textAlign: 'center'
  },
  success: {
    color: 'green',
    fontSize: '14px',
    textAlign: 'center'
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
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  chatInfo: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    flex: 1
  },
  avatar: {
    width: '50px',
    height: '50px',
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
    color: '#333'
  },
  senderPhone: {
    fontSize: '12px',
    color: '#666',
    marginTop: '2px'
  },
  messagePreview: {
    fontSize: '14px',
    color: '#666',
    marginTop: '5px'
  },
  viewBtn: {
    padding: '8px 15px',
    backgroundColor: '#007bff',
    color: 'white',
    borderRadius: '5px',
    fontSize: '14px'
  },
  modal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  modalTitle: {
    margin: 0,
    color: '#333'
  },
  modalPhone: {
    fontSize: '14px',
    color: '#666',
    marginBottom: '20px'
  },
  countdown: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#dc3545'
  },
  messageBody: {
    fontSize: '18px',
    lineHeight: '1.6',
    color: '#333',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '20px',
    minHeight: '100px'
  },
  closeBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
  }
};

export default Home;