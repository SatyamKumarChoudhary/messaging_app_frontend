import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createGroup } from '../services/groupAPI';

function CreateGroup() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  const [memberPhones, setMemberPhones] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAddMember = () => {
    if (!memberPhone.trim()) {
      setError('Please enter a phone number');
      return;
    }

    // Validate phone format (basic)
    if (!memberPhone.startsWith('+')) {
      setError('Phone number must start with + (e.g., +919876543210)');
      return;
    }

    if (memberPhones.includes(memberPhone)) {
      setError('This member is already added');
      return;
    }

    setMemberPhones([...memberPhones, memberPhone]);
    setMemberPhone('');
    setError('');
  };

  const handleRemoveMember = (phone) => {
    setMemberPhones(memberPhones.filter(p => p !== phone));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!groupName.trim()) {
      setError('Group name is required');
      return;
    }

    setLoading(true);

    try {
      const groupData = {
        name: groupName.trim(),
        description: description.trim() || undefined,
        member_phones: memberPhones
      };

      const response = await createGroup(groupData);
      console.log('Group created:', response);
      
      // Redirect to groups page
      navigate('/groups');
    } catch (err) {
      setError(err.error || 'Failed to create group');
      console.error('Create group error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/groups')} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Create Group</h1>
        <div style={{ width: '80px' }}></div> {/* Spacer for centering */}
      </div>

      {/* Form */}
      <div style={styles.content}>
        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Group Name */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Group Name *</label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Family, Work Team, Friends"
                required
                style={styles.input}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                rows="3"
                style={styles.textarea}
                maxLength={500}
              />
            </div>

            {/* Add Members */}
            <div style={styles.formGroup}>
              <label style={styles.label}>Add Members (Optional)</label>
              <div style={styles.addMemberRow}>
                <input
                  type="tel"
                  value={memberPhone}
                  onChange={(e) => setMemberPhone(e.target.value)}
                  placeholder="+919876543210"
                  style={styles.phoneInput}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddMember();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddMember}
                  style={styles.addButton}
                >
                  + Add
                </button>
              </div>
              <p style={styles.hint}>
                Add members by phone number (they must be registered)
              </p>
            </div>

            {/* Members List */}
            {memberPhones.length > 0 && (
              <div style={styles.membersList}>
                <label style={styles.label}>
                  Members ({memberPhones.length})
                </label>
                {memberPhones.map((phone, index) => (
                  <div key={index} style={styles.memberItem}>
                    <span style={styles.memberPhone}>{phone}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveMember(phone)}
                      style={styles.removeButton}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Error Message */}
            {error && <p style={styles.error}>{error}</p>}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitButton,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Creating Group...' : 'Create Group'}
            </button>

            {/* Info Box */}
            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                💡 <strong>Note:</strong> You'll be added as the admin automatically. 
                You can add more members later.
              </p>
            </div>
          </form>
        </div>
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
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '4px'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  textarea: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'Arial, sans-serif',
    resize: 'vertical',
    transition: 'border-color 0.2s'
  },
  addMemberRow: {
    display: 'flex',
    gap: '8px'
  },
  phoneInput: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    outline: 'none'
  },
  addButton: {
    padding: '12px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  hint: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0
  },
  membersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  memberItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  memberPhone: {
    fontSize: '15px',
    color: '#374151',
    fontWeight: '500'
  },
  removeButton: {
    padding: '4px 8px',
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '14px',
    margin: 0
  },
  submitButton: {
    padding: '14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
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

export default CreateGroup;