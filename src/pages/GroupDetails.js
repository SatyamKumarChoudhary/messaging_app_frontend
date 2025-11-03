import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getGroupDetails, addGroupMember } from '../services/groupAPI';

function GroupDetails() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groupInfo, setGroupInfo] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addMemberPhone, setAddMemberPhone] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Fetch group details
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setLoading(true);
        const data = await getGroupDetails(groupId);
        setGroupInfo(data.group);
        setMembers(data.group.members || []);
      } catch (err) {
        setError('Failed to load group details');
        console.error('Fetch details error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (groupId) {
      fetchDetails();
    }
  }, [groupId]);

  // Check if current user is admin
  const isAdmin = members.find(m => m.user_id === user.id)?.role === 'admin';

  // Add member
  const handleAddMember = async (e) => {
    e.preventDefault();
    
    if (!addMemberPhone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    if (!addMemberPhone.startsWith('+')) {
      setError('Phone number must start with + (e.g., +919876543210)');
      return;
    }

    setAddingMember(true);
    setError('');

    try {
      const response = await addGroupMember(groupId, addMemberPhone);
      
      // Refresh group details
      const data = await getGroupDetails(groupId);
      setGroupInfo(data.group);
      setMembers(data.group.members || []);
      
      setAddMemberPhone('');
      setShowAddMember(false);
      alert('Member added successfully!');
    } catch (err) {
      setError(err.error || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  // Leave group
  const handleLeaveGroup = () => {
    const confirmLeave = window.confirm('Are you sure you want to leave this group?');
    if (confirmLeave) {
      alert('Leave group feature coming soon!');
      // TODO: Implement leave group API
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(`/group/${groupId}`)} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Group Details</h1>
        <div style={{ width: '80px' }}></div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {loading && (
          <div style={styles.loadingContainer}>
            <p style={styles.loadingText}>Loading details...</p>
          </div>
        )}

        {!loading && groupInfo && (
          <>
            {/* Group Info Card */}
            <div style={styles.card}>
              <div style={styles.groupAvatar}>
                {groupInfo.name.charAt(0).toUpperCase()}
              </div>
              <h2 style={styles.groupName}>{groupInfo.name}</h2>
              {groupInfo.description && (
                <p style={styles.groupDescription}>{groupInfo.description}</p>
              )}
              <p style={styles.memberCount}>
                👥 {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
              <p style={styles.createdAt}>
                Created {new Date(groupInfo.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Members Section */}
            <div style={styles.card}>
              <div style={styles.sectionHeader}>
                <h3 style={styles.sectionTitle}>Members</h3>
                {isAdmin && (
                  <button
                    onClick={() => setShowAddMember(!showAddMember)}
                    style={styles.addMemberBtn}
                  >
                    + Add Member
                  </button>
                )}
              </div>

              {/* Add Member Form */}
              {showAddMember && (
                <div style={styles.addMemberForm}>
                  <form onSubmit={handleAddMember} style={styles.form}>
                    <input
                      type="tel"
                      value={addMemberPhone}
                      onChange={(e) => setAddMemberPhone(e.target.value)}
                      placeholder="+919876543210"
                      style={styles.input}
                      disabled={addingMember}
                    />
                    <div style={styles.formButtons}>
                      <button
                        type="submit"
                        disabled={addingMember}
                        style={styles.submitBtn}
                      >
                        {addingMember ? 'Adding...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddMember(false);
                          setAddMemberPhone('');
                          setError('');
                        }}
                        style={styles.cancelBtn}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                  {error && <p style={styles.error}>{error}</p>}
                </div>
              )}

              {/* Members List */}
              <div style={styles.membersList}>
                {members.map((member) => (
                  <div key={member.user_id} style={styles.memberItem}>
                    <div style={styles.memberAvatar}>
                      {member.username.charAt(0).toUpperCase()}
                    </div>
                    <div style={styles.memberInfo}>
                      <div style={styles.memberName}>
                        {member.username}
                        {member.user_id === user.id && (
                          <span style={styles.youBadge}>(You)</span>
                        )}
                      </div>
                      <div style={styles.memberPhone}>{member.phone}</div>
                    </div>
                    {member.role === 'admin' && (
                      <span style={styles.adminBadge}>Admin</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={styles.card}>
              <h3 style={styles.sectionTitle}>Actions</h3>
              
              {isAdmin && (
                <button style={styles.actionBtn}>
                  ✏️ Edit Group Info
                </button>
              )}
              
              <button
                onClick={handleLeaveGroup}
                style={{...styles.actionBtn, ...styles.dangerBtn}}
              >
                🚪 Leave Group
              </button>
            </div>

            {/* Info Box */}
            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                💡 <strong>Note:</strong> Only admins can add members and edit group settings.
              </p>
            </div>
          </>
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
  content: {
    padding: '20px',
    maxWidth: '600px',
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
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  groupAvatar: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
    fontWeight: '600',
    margin: '0 auto 16px'
  },
  groupName: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    margin: '0 0 8px 0'
  },
  groupDescription: {
    fontSize: '15px',
    color: '#6b7280',
    textAlign: 'center',
    margin: '0 0 16px 0',
    lineHeight: '1.5'
  },
  memberCount: {
    fontSize: '16px',
    color: '#374151',
    textAlign: 'center',
    margin: '0 0 8px 0',
    fontWeight: '500'
  },
  createdAt: {
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center',
    margin: 0
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  addMemberBtn: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  addMemberForm: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none'
  },
  formButtons: {
    display: 'flex',
    gap: '8px'
  },
  submitBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  cancelBtn: {
    flex: 1,
    padding: '10px',
    backgroundColor: '#6b7280',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  error: {
    color: '#ef4444',
    fontSize: '14px',
    margin: '8px 0 0 0'
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  memberAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600',
    flexShrink: 0
  },
  memberInfo: {
    flex: 1
  },
  memberName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  youBadge: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#6b7280'
  },
  memberPhone: {
    fontSize: '14px',
    color: '#6b7280'
  },
  adminBadge: {
    padding: '4px 12px',
    backgroundColor: '#fbbf24',
    color: '#78350f',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0
  },
  actionBtn: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginBottom: '12px',
    textAlign: 'left'
  },
  dangerBtn: {
    backgroundColor: '#fee2e2',
    color: '#dc2626'
  },
  infoBox: {
    padding: '12px',
    backgroundColor: '#eff6ff',
    borderRadius: '8px',
    border: '1px solid #bfdbfe'
  },
  infoText: {
    fontSize: '14px',
    color: '#1e40af',
    margin: 0,
    lineHeight: '1.5'
  }
};

export default GroupDetails;