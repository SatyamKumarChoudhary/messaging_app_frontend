import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserGroups } from '../services/groupAPI';
import GroupCard from '../components/GroupCard';
import EmptyState from '../components/EmptyState';
import './Groups.css'; // We'll create this

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
    <div className="groups-container">
      {/* Animated Background */}
      <div className="groups-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Header */}
      <header className="groups-header">
        <button onClick={handleBack} className="back-btn">
          <span className="back-icon">←</span>
          <span className="back-text">Back</span>
        </button>
        
        <div className="header-center">
          <h1 className="groups-title">
            <span className="title-icon">👥</span>
            Groups
          </h1>
          <p className="groups-subtitle">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
        </div>

        <button onClick={handleCreateGroup} className="create-btn">
          <span className="create-icon">+</span>
          <span className="create-text">New Group</span>
        </button>
      </header>

      {/* Content */}
      <main className="groups-content">
        {loading && (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading your groups...</p>
          </div>
        )}

        {!loading && error && (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p className="error-text">{error}</p>
            <button onClick={fetchGroups} className="retry-btn">
              <span>🔄</span> Try Again
            </button>
          </div>
        )}

        {!loading && !error && groups.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon-wrapper">
              <span className="empty-icon">👥</span>
            </div>
            <h2 className="empty-title">No groups yet</h2>
            <p className="empty-subtitle">
              Create your first group to start chatting<br />
              with multiple people anonymously!
            </p>
            <button onClick={handleCreateGroup} className="empty-action-btn">
              <span>✨</span> Create Your First Group
            </button>
          </div>
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="groups-grid">
            {groups.map((group, index) => (
              <div 
                key={group.id} 
                className="group-card-wrapper"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <GroupCard group={group} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Groups;