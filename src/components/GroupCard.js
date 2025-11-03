import React from 'react';
import { useNavigate } from 'react-router-dom';

function GroupCard({ group }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/group/${group.id}`);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div onClick={handleClick} style={styles.card}>
      <div style={styles.avatar}>
        <div style={styles.avatarText}>
          {group.name.charAt(0).toUpperCase()}
        </div>
      </div>

      <div style={styles.content}>
        <div style={styles.header}>
          <h3 style={styles.groupName}>{group.name}</h3>
          {group.last_message_time && (
            <span style={styles.time}>
              {formatTime(group.last_message_time)}
            </span>
          )}
        </div>

        <div style={styles.footer}>
          <p style={styles.lastMessage}>
            {group.last_message || 'No messages yet'}
          </p>
          {group.unread_count > 0 && (
            <div style={styles.badge}>
              {group.unread_count}
            </div>
          )}
        </div>

        <p style={styles.memberCount}>
          👥 {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
        </p>
      </div>
    </div>
  );
}

const styles = {
  card: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    backgroundColor: '#007bff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
    flexShrink: 0
  },
  avatarText: {
    color: 'white',
    fontSize: '24px',
    fontWeight: '600'
  },
  content: {
    flex: 1,
    minWidth: 0
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  groupName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  time: {
    fontSize: '12px',
    color: '#9ca3af',
    marginLeft: '8px',
    flexShrink: 0
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px'
  },
  lastMessage: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1
  },
  badge: {
    minWidth: '24px',
    height: '24px',
    borderRadius: '12px',
    backgroundColor: '#22c55e',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    padding: '0 8px',
    marginLeft: '8px'
  },
  memberCount: {
    fontSize: '13px',
    color: '#9ca3af',
    margin: 0
  }
};

export default GroupCard;
