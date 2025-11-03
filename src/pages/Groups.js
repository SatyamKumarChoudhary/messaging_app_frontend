import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroups } from '../services/groupAPI';
import GroupCard from '../components/GroupCard';
import EmptyState from '../components/EmptyState';

function Groups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserGroups();
      setGroups(data.groups || []);
    } catch (err) {
      setError(err.error || 'Failed to load groups');
      console.error('Fetch groups error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = () => {
    navigate('/create-group');
  };

  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={handleBack} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Groups</h1>
        <button onClick={handleCreateGroup} style={styles.createButton}>
          + New
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {loading && (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Loading groups...</p>
          </div>
        )}

        {!loading && error && (
          <div style={styles.errorContainer}>
            <p style={styles.errorText}>❌ {error}</p>
            <button onClick={fetchGroups} style={styles.retryButton}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <EmptyState
            icon="👥"
            title="No groups yet"
            message="Create a group to start chatting with multiple people at once!"
            actionLabel="Create Group"
            onAction={handleCreateGroup}
          />
        )}

        {!loading && !error && groups.length > 0 && (
          <div style={styles.groupsList}>
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
    position: 'sticky',
    top: 0,
    zIndex: 10
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
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  createButton: {
    padding: '8px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  content: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  errorText: {
    fontSize: '16px',
    color: '#ef4444',
    marginBottom: '20px'
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    cursor: 'pointer'
  },
  groupsList: {
    display: 'flex',
    flexDirection: 'column'
  }
};

export default Groups;