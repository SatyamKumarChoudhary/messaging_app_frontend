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

  // Helper function to get message preview based on type
  const getMessagePreview = (msg) => {
    if (msg.message_type === 'image') {
      return '📷 Image';
    } else if (msg.message_type === 'video') {
      return '🎥 Video';
    } else if (msg.message_type === 'audio' || msg.message_type === 'voice') {
      return '🎵 Audio';
    } else if (msg.message_type === 'file') {
      return `📎 ${msg.file_name || 'File'}`;
    } else if (msg.text) {
      return msg.text.substring(0, 30) + (msg.text.length > 30 ? '...' : '');
    }
    return 'New message';
  };

  // Helper function to render media content in modal
  const renderMediaContent = (msg) => {
    // If it's an image
    if (msg.message_type === 'image' && msg.media_url) {
      return (
        <div style={styles.mediaContainer}>
          <img 
            src={msg.media_url} 
            alt="Shared image" 
            style={styles.image}
          />
          {msg.text && <p style={styles.mediaCaption}>{msg.text}</p>}
        </div>
      );
    }
    
    // If it's a video
    if (msg.message_type === 'video' && msg.media_url) {
      return (
        <div style={styles.mediaContainer}>
          <video 
            src={msg.media_url} 
            controls 
            style={styles.video}
          >
            Your browser does not support video playback.
          </video>
          {msg.text && <p style={styles.mediaCaption}>{msg.text}</p>}
        </div>
      );
    }
    
    // If it's audio/voice
    if ((msg.message_type === 'audio' || msg.message_type === 'voice') && msg.media_url) {
      return (
        <div style={styles.mediaContainer}>
          <audio 
            src={msg.media_url} 
            controls 
            style={styles.audio}
          >
            Your browser does not support audio playback.
          </audio>
          {msg.text && <p style={styles.mediaCaption}>{msg.text}</p>}
        </div>
      );
    }
    
    // If it's a file (PDF, DOC, etc)
    if (msg.message_type === 'file' && msg.media_url) {
      return (
        <div style={styles.mediaContainer}>
          <div style={styles.fileInfo}>
            <span style={styles.fileIcon}>📎</span>
            <div>
              <div style={styles.fileName}>{msg.file_name || 'Download File'}</div>
              {msg.file_size && (
                <div style={styles.fileSize}>
                  {(msg.file_size / 1024).toFixed(2)} KB
                </div>
              )}
            </div>
          </div>
          <a 
            href={msg.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            style={styles.downloadBtn}
          >
            View/Download File
          </a>
          {msg.text && <p style={styles.mediaCaption}>{msg.text}</p>}
        </div>
      );
    }
    
    // Default: just text message
    return <p style={styles.messageText}>{msg.text}</p>;
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
                      {getMessagePreview(msg)}
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
              {renderMediaContent(viewingMessage)}
            </div>
            
            <div style={styles.modalFooter}>
              <small style={styles.messageTime}>
                {viewingMessage.sender_phone || ''}
              </small>
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
    fontSize: '14px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  sectionTitle: {
    fontSize: '20px',
    marginBottom: '15px',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  input: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px'
  },
  textarea: {
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'Arial, sans-serif'
  },
  error: {
    color: '#dc3545',
    margin: 0,
    fontSize: '14px'
  },
  success: {
    color: '#28a745',
    margin: 0,
    fontSize: '14px'
  },
  sendBtn: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  noMessages: {
    textAlign: 'center',
    color: '#666',
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
    fontSize: '18px',
    fontWeight: 'bold'
  },
  chatDetails: {
    flex: 1
  },
  senderName: {
    fontWeight: 'bold',
    fontSize: '16px',
    marginBottom: '4px',
    color: '#333'
  },
  messagePreview: {
    color: '#666',
    fontSize: '14px'
  },
  viewBtn: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    padding: '20px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto',
    position: 'relative'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '10px',
    borderBottom: '1px solid #eee'
  },
  modalTitle: {
    margin: 0,
    fontSize: '18px',
    color: '#333'
  },
  countdown: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#dc3545'
  },
  modalBody: {
    marginBottom: '20px',
    minHeight: '100px'
  },
  messageText: {
    fontSize: '16px',
    lineHeight: '1.5',
    color: '#333',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  modalFooter: {
    textAlign: 'center',
    paddingTop: '10px',
    borderTop: '1px solid #eee',
    marginBottom: '15px'
  },
  messageTime: {
    color: '#999',
    fontSize: '12px'
  },
  closeBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  // Media-specific styles
  mediaContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    alignItems: 'center'
  },
  image: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px',
    objectFit: 'contain'
  },
  video: {
    maxWidth: '100%',
    maxHeight: '400px',
    borderRadius: '8px'
  },
  audio: {
    width: '100%',
    maxWidth: '400px'
  },
  mediaCaption: {
    fontSize: '14px',
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: '10px'
  },
  fileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '15px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    width: '100%'
  },
  fileIcon: {
    fontSize: '40px'
  },
  fileName: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333',
    wordBreak: 'break-word'
  },
  fileSize: {
    fontSize: '12px',
    color: '#999',
    marginTop: '4px'
  },
  downloadBtn: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '5px',
    fontSize: '14px',
    fontWeight: 'bold',
    textAlign: 'center',
    display: 'inline-block'
  }
};

export default Home;