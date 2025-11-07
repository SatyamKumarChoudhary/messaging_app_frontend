import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getGroupMessages, 
  getUnreadMessages,
  sendGroupMessage, 
  markMessagesAsRead,
  getGroupDetails 
} from '../services/groupAPI';
import { connectSocket, disconnectSocket } from '../services/socket';
import './GroupChat.css'; // We'll create this

function GroupChat() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [groupInfo, setGroupInfo] = useState(null);
  const [firstUnreadIndex, setFirstUnreadIndex] = useState(null);
  const messagesEndRef = useRef(null);
  const unreadDividerRef = useRef(null);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to unread divider
  const scrollToUnread = () => {
    if (unreadDividerRef.current) {
      unreadDividerRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Fetch group details
  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const data = await getGroupDetails(groupId);
        setGroupInfo(data.group);
      } catch (err) {
        console.error('Error fetching group details:', err);
      }
    };

    if (groupId) {
      fetchGroupInfo();
    }
  }, [groupId]);

  // Fetch messages and unread messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        // Fetch unread messages first
        const unreadData = await getUnreadMessages(groupId);
        const unreadMsgs = unreadData.messages || [];
        setUnreadMessages(unreadMsgs);
        
        // Fetch all messages
        const allData = await getGroupMessages(groupId, 100);
        const allMsgs = allData.messages || [];
        setMessages(allMsgs);
        
        // Find index of first unread message
        if (unreadMsgs.length > 0) {
          const firstUnreadId = unreadMsgs[0].id;
          const index = allMsgs.findIndex(msg => msg.id === firstUnreadId);
          setFirstUnreadIndex(index);
        }
        
      } catch (err) {
        setError('Failed to load messages');
        console.error('Fetch messages error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchMessages();
    }
  }, [groupId]);

  // Scroll to unread divider after messages load
  useEffect(() => {
    if (!loading && firstUnreadIndex !== null && unreadMessages.length > 0) {
      setTimeout(scrollToUnread, 100);
    } else if (!loading && messages.length > 0) {
      setTimeout(scrollToBottom, 100);
    }
  }, [loading, firstUnreadIndex, unreadMessages.length, messages.length]);

  // Socket.IO for real-time messages
  useEffect(() => {
    const socket = connectSocket(token);

    socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO for group chat');
    });

    // Listen for new group messages
    socket.on('new_group_message', (data) => {
      console.log('📨 New group message:', data);
      
      // Only add if it's for this group
      if (data.group_id === parseInt(groupId)) {
        setMessages(prev => [...prev, data]);
        
        // Auto-mark as read
        markMessagesAsRead(groupId, data.id);
        
        // Scroll to bottom
        setTimeout(scrollToBottom, 100);
      }
    });

    return () => {
      disconnectSocket();
    };
  }, [groupId, token]);

  // Mark all as read when user scrolls to bottom
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    if (isAtBottom && messages.length > 0 && unreadMessages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      markMessagesAsRead(groupId, lastMessage.id);
      setUnreadMessages([]);
      setFirstUnreadIndex(null);
    }
  };

  // Send message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    setSending(true);
    setError('');

    try {
      const messageData = {
        group_id: parseInt(groupId),
        text: newMessage.trim(),
        message_type: 'text'
      };

      await sendGroupMessage(messageData);
      setNewMessage('');
      
      // Clear unread messages since user is active
      setUnreadMessages([]);
      setFirstUnreadIndex(null);
      
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
    } finally {
      setSending(false);
    }
  };

  // Format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="group-chat-container">
      {/* Animated Background */}
      <div className="chat-background">
        <div className="chat-orb orb-1"></div>
        <div className="chat-orb orb-2"></div>
      </div>

      {/* Header */}
      <header className="chat-header">
        <button onClick={() => navigate('/groups')} className="chat-back-btn">
          <span className="back-arrow">←</span>
        </button>
        
        <div className="chat-header-info">
          <div className="group-avatar">
            <span className="avatar-icon">👥</span>
          </div>
          <div className="group-details">
            <h2 className="chat-group-name">
              {groupInfo?.name || 'Loading...'}
            </h2>
            <p className="chat-member-count">
              <span className="online-dot"></span>
              {groupInfo?.member_count || 0} members
            </p>
          </div>
        </div>

        <button 
          onClick={() => navigate(`/group/${groupId}/details`)} 
          className="chat-menu-btn"
        >
          <span className="menu-dots">⋮</span>
        </button>
      </header>

      {/* Messages Container */}
      <div className="chat-messages-container" onScroll={handleScroll}>
        {loading && (
          <div className="chat-loading">
            <div className="chat-spinner"></div>
            <p className="chat-loading-text">Loading messages...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="chat-empty">
            <div className="empty-icon-box">
              <span className="chat-empty-icon">💬</span>
            </div>
            <h3 className="chat-empty-title">No messages yet</h3>
            <p className="chat-empty-subtitle">Be the first to send a message!</p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div className="messages-list">
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender_id === user.id;
              const showUnreadDivider = index === firstUnreadIndex && unreadMessages.length > 0;
              
              return (
                <React.Fragment key={msg.id}>
                  {/* Unread Messages Divider */}
                  {showUnreadDivider && (
                    <div ref={unreadDividerRef} className="unread-divider">
                      <div className="unread-line"></div>
                      <span className="unread-badge">
                        {unreadMessages.length} new message{unreadMessages.length > 1 ? 's' : ''}
                      </span>
                      <div className="unread-line"></div>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div className={`message-row ${isOwnMessage ? 'own-message' : 'other-message'}`}>
                    {!isOwnMessage && (
                      <div className="message-avatar">
                        <span className="avatar-letter">{msg.sender_name?.[0]?.toUpperCase() || '👻'}</span>
                      </div>
                    )}
                    
                    <div className={`message-bubble ${isOwnMessage ? 'bubble-own' : 'bubble-other'}`}>
                      {!isOwnMessage && (
                        <p className="message-sender">{msg.sender_name}</p>
                      )}
                      <p className="message-text">{msg.text}</p>
                      <div className="message-footer">
                        <span className="message-time">{formatTime(msg.created_at)}</span>
                        {isOwnMessage && <span className="message-status">✓</span>}
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Unread Banner */}
      {unreadMessages.length > 0 && (
        <div className="unread-float-banner" onClick={scrollToUnread}>
          <span className="banner-text">
            ↓ {unreadMessages.length} new message{unreadMessages.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Input Area */}
      <div className="chat-input-area">
        {error && (
          <div className="input-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="input-form">
          <div className="input-wrapper">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="message-input"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !newMessage.trim()}
              className={`send-btn ${(sending || !newMessage.trim()) ? 'disabled' : ''}`}
            >
              {sending ? (
                <span className="sending-icon">⏳</span>
              ) : (
                <span className="send-icon">📤</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GroupChat;