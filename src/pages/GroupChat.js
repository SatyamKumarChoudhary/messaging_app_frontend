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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/groups')} style={styles.backButton}>
          ← Back
        </button>
        <div style={styles.headerInfo}>
          <h2 style={styles.groupName}>
            {groupInfo?.name || 'Loading...'}
          </h2>
          <p style={styles.memberCount}>
            👥 {groupInfo?.member_count || 0} members
          </p>
        </div>
        <button 
  onClick={() => navigate(`/group/${groupId}/details`)} 
  style={styles.detailsButton}
>
  ⋮
</button>
      </div>

      {/* Messages Container */}
      <div style={styles.messagesContainer} onScroll={handleScroll}>
        {loading && (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Loading messages...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={styles.emptyContainer}>
            <p style={styles.emptyIcon}>💬</p>
            <p style={styles.emptyText}>No messages yet</p>
            <p style={styles.emptySubtext}>Be the first to send a message!</p>
          </div>
        )}

        {!loading && messages.length > 0 && (
          <div style={styles.messagesList}>
            {messages.map((msg, index) => {
              const isOwnMessage = msg.sender_id === user.id;
              const showUnreadDivider = index === firstUnreadIndex && unreadMessages.length > 0;
              
              return (
                <React.Fragment key={msg.id}>
                  {/* Unread Messages Divider */}
                  {showUnreadDivider && (
                    <div ref={unreadDividerRef} style={styles.unreadDivider}>
                      <div style={styles.unreadLine}></div>
                      <span style={styles.unreadText}>
                        {unreadMessages.length} unread message{unreadMessages.length > 1 ? 's' : ''}
                      </span>
                      <div style={styles.unreadLine}></div>
                    </div>
                  )}
                  
                  {/* Message Bubble */}
                  <div
                    style={{
                      ...styles.messageWrapper,
                      justifyContent: isOwnMessage ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        backgroundColor: isOwnMessage ? '#007bff' : 'white',
                        color: isOwnMessage ? 'white' : '#333',
                        alignSelf: isOwnMessage ? 'flex-end' : 'flex-start'
                      }}
                    >
                      {!isOwnMessage && (
                        <p style={styles.senderName}>{msg.sender_name}</p>
                      )}
                      <p style={styles.messageText}>{msg.text}</p>
                      <p
                        style={{
                          ...styles.messageTime,
                          color: isOwnMessage ? 'rgba(255,255,255,0.7)' : '#999'
                        }}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={styles.inputContainer}>
        {error && <p style={styles.error}>{error}</p>}
        
        {/* Show unread count badge */}
        {unreadMessages.length > 0 && (
          <div style={styles.unreadBanner} onClick={scrollToUnread}>
            <span style={styles.unreadBannerText}>
              ↓ {unreadMessages.length} new message{unreadMessages.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} style={styles.inputForm}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            style={styles.input}
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !newMessage.trim()}
            style={{
              ...styles.sendButton,
              opacity: sending || !newMessage.trim() ? 0.5 : 1,
              cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer'
            }}
          >
            {sending ? '⏳' : '📤'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: '#f3f4f6'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    flexShrink: 0
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#007bff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer',
    fontWeight: '500'
  },
  headerInfo: {
    textAlign: 'center',
    flex: 1
  },
  groupName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  memberCount: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column'
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%'
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    textAlign: 'center'
  },
  emptyIcon: {
    fontSize: '64px',
    margin: 0
  },
  emptyText: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#374151',
    margin: '16px 0 8px 0'
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#9ca3af',
    margin: 0
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  unreadDivider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0',
    padding: '0 16px'
  },
  unreadLine: {
    flex: 1,
    height: '2px',
    backgroundColor: '#ef4444'
  },
  unreadText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ef4444',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap'
  },
  messageWrapper: {
    display: 'flex',
    width: '100%'
  },

  detailsButton: {
  padding: '8px 16px',
  backgroundColor: 'transparent',
  color: '#007bff',
  border: 'none',
  borderRadius: '8px',
  fontSize: '24px',
  cursor: 'pointer',
  fontWeight: 'bold'
},


  messageBubble: {
    maxWidth: '70%',
    padding: '12px 16px',
    borderRadius: '16px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    wordWrap: 'break-word'
  },
  senderName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#007bff',
    margin: '0 0 4px 0'
  },
  messageText: {
    fontSize: '15px',
    lineHeight: '1.4',
    margin: '0 0 4px 0',
    whiteSpace: 'pre-wrap'
  },
  messageTime: {
    fontSize: '11px',
    margin: 0
  },
  inputContainer: {
    padding: '16px',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
    flexShrink: 0,
    position: 'relative'
  },
  unreadBanner: {
    position: 'absolute',
    top: '-40px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ef4444',
    color: 'white',
    padding: '8px 20px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
    zIndex: 10,
    animation: 'bounce 2s infinite'
  },
  unreadBannerText: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    margin: '0 0 8px 0',
    textAlign: 'center'
  },
  inputForm: {
    display: 'flex',
    gap: '8px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #d1d5db',
    borderRadius: '24px',
    outline: 'none'
  },
  sendButton: {
    width: '48px',
    height: '48px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    fontSize: '20px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  }
};

export default GroupChat;