import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, updateProfile, uploadAvatar } from '../services/profileAPI';
import './Profile.css';

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch profile on component mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile(data.user);
      setFormData({
        username: data.user.username,
        bio: data.user.bio || ''
      });
    } catch (err) {
      setError(err.error || 'Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditMode(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData({
      username: profile.username,
      bio: profile.bio || ''
    });
    setError('');
    setSuccess('');
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    try {
      setError('');
      setSuccess('');

      if (!formData.username.trim()) {
        setError('Username cannot be empty');
        return;
      }

      const data = await updateProfile(formData);
      setProfile(data.user);
      setEditMode(false);
      setSuccess('Profile updated successfully!');
      
      // Update localStorage
      const user = JSON.parse(localStorage.getItem('user'));
      localStorage.setItem('user', JSON.stringify({ ...user, ...data.user }));

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Failed to update profile');
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    try {
      setUploading(true);
      setError('');
      
      const data = await uploadAvatar(file);
      setProfile({ ...profile, avatar_url: data.avatar_url });
      setSuccess('Avatar updated successfully!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.error || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-background">
          <div className="profile-orb orb-1"></div>
          <div className="profile-orb orb-2"></div>
        </div>
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-container">
        <div className="profile-error">
          <p>Failed to load profile</p>
          <button onClick={() => navigate('/home')} className="btn-back">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Animated Background */}
      <div className="profile-background">
        <div className="profile-orb orb-1"></div>
        <div className="profile-orb orb-2"></div>
      </div>

      {/* Header */}
      <header className="profile-header">
        <button onClick={() => navigate('/home')} className="profile-back-btn">
          <span>←</span> Back
        </button>
        <h1 className="profile-header-title">Profile</h1>
        <button onClick={handleLogout} className="profile-logout-btn">
          Logout
        </button>
      </header>

      {/* Main Content */}
      <main className="profile-content">
        <div className="profile-card">
          
          {/* Avatar Section */}
          <div className="avatar-section">
            <div 
              className="avatar-wrapper" 
              onClick={handleAvatarClick}
              style={{ cursor: uploading ? 'wait' : 'pointer' }}
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="avatar-image" />
              ) : (
                <div className="avatar-placeholder">
                  {profile.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="avatar-overlay">
                {uploading ? '⏳' : '📷'}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              style={{ display: 'none' }}
            />
            <p className="avatar-hint">Click to change avatar</p>
          </div>

          {/* Profile Info */}
          <div className="profile-info">
            
            {/* Username */}
            <div className="info-group">
              <label className="info-label">👤 Username</label>
              {editMode ? (
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="info-input"
                  placeholder="Your username"
                />
              ) : (
                <div className="info-value">{profile.username}</div>
              )}
            </div>

            {/* Ghost Name */}
            <div className="info-group">
              <label className="info-label">👻 Ghost Identity</label>
              <div className="ghost-badge">{profile.ghost_name}</div>
              <p className="info-hint">Your permanent anonymous identity</p>
            </div>

            {/* Email */}
            <div className="info-group">
              <label className="info-label">📧 Email</label>
              <div className="info-value">{profile.email}</div>
            </div>

            {/* Phone */}
            <div className="info-group">
              <label className="info-label">📱 Phone</label>
              <div className="info-value">{profile.phone}</div>
            </div>

            {/* Bio */}
            <div className="info-group">
              <label className="info-label">💬 Bio</label>
              {editMode ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="info-textarea"
                  placeholder="Tell others about yourself..."
                  maxLength={200}
                  rows={3}
                />
              ) : (
                <div className="info-value">
                  {profile.bio || 'No bio yet'}
                </div>
              )}
              {editMode && (
                <p className="char-count">{formData.bio.length}/200</p>
              )}
            </div>

            {/* Credits & Premium */}
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-value">{profile.credits}</div>
                  <div className="stat-label">Credits</div>
                </div>
              </div>

              <div className="stat-box">
                <div className="stat-icon">{profile.is_premium ? '👑' : '🆓'}</div>
                <div className="stat-info">
                  <div className="stat-value">
                    {profile.is_premium ? 'Premium' : 'Free'}
                  </div>
                  <div className="stat-label">Status</div>
                </div>
              </div>
            </div>

            {/* Member Since */}
            <div className="info-group">
              <label className="info-label">📅 Member Since</label>
              <div className="info-value">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>

          </div>

          {/* Status Messages */}
          {error && (
            <div className="alert alert-error">
              <span>⚠️</span> {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <span>✅</span> {success}
            </div>
          )}

          {/* Action Buttons */}
          <div className="profile-actions">
            {editMode ? (
              <>
                <button onClick={handleSave} className="btn-primary">
                  💾 Save Changes
                </button>
                <button onClick={handleCancel} className="btn-secondary">
                  ✕ Cancel
                </button>
              </>
            ) : (
              <button onClick={handleEdit} className="btn-primary">
                ✏️ Edit Profile
              </button>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}

export default Profile;