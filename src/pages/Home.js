import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { connectSocket, disconnectSocket } from '../services/socket';
import './Home.css'; // New CSS file for animations

function Home() {
  const [receiver, setReceiver] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [viewingMessage, setViewingMessage] = useState(null);
  const [countdown, setCountdown] = useState(15);
  
  // File upload states
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  
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

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setAudioBlob(audioBlob);
        setAudioURL(audioUrl);
        
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
      
    } catch (err) {
      setError('Microphone access denied or not available');
      console.error('Recording error:', err);
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };

  // Clear recorded audio
  const clearRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
    setRecordingTime(0);
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    clearRecording();

    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFilePreview({
          type: 'image',
          url: e.target.result,
          name: file.name
        });
      };
      reader.readAsDataURL(file);
    } else if (file.type.startsWith('video/')) {
      setFilePreview({
        type: 'video',
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    } else if (file.type.startsWith('audio/')) {
      setFilePreview({
        type: 'audio',
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    } else {
      setFilePreview({
        type: 'file',
        name: file.name,
        size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    }
  };

  // Clear selected file
  const clearFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload file to S3
  const uploadFileToS3 = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        'http://localhost:3001/api/media/upload',
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          }
        }
      );

      return response.data.data;
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Upload failed');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      let messageData = {
        receiver_phone: receiver,
      };

      if (audioBlob) {
        setUploading(true);
        
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        
        const uploadResult = await uploadFileToS3(audioFile);
        
        messageData.message_type = 'audio';
        messageData.media_url = uploadResult.media_url;
        messageData.file_name = uploadResult.file_name;
        messageData.file_size = uploadResult.file_size;
        
        if (message.trim()) {
          messageData.text = message;
        }
      }
      else if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadFileToS3(selectedFile);
        
        messageData.message_type = uploadResult.message_type;
        messageData.media_url = uploadResult.media_url;
        messageData.file_name = uploadResult.file_name;
        messageData.file_size = uploadResult.file_size;
        
        if (message.trim()) {
          messageData.text = message;
        }
      } else {
        if (!message.trim()) {
          setError('Please enter a message, record voice, or select a file');
          setLoading(false);
          return;
        }
        messageData.text = message;
      }

      await axios.post(
        'http://localhost:3001/api/messages/send',
        messageData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setSuccess(audioBlob ? 'Voice message sent!' : selectedFile ? 'Media sent!' : 'Message sent!');
      setReceiver('');
      setMessage('');
      clearFile();
      clearRecording();
      setUploadProgress(0);
      
      // Auto-clear success after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || err.response?.data?.error || 'Failed to send');
    } finally {
      setLoading(false);
      setUploading(false);
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const renderMediaContent = (msg) => {
    if (msg.message_type === 'image' && msg.media_url) {
      return (
        <div className="media-container">
          <img src={msg.media_url} alt="Shared content" className="media-image" />
          {msg.text && <p className="media-caption">{msg.text}</p>}
        </div>
      );
    }
    
    if (msg.message_type === 'video' && msg.media_url) {
      return (
        <div className="media-container">
          <video src={msg.media_url} controls className="media-video">
            Your browser does not support video playback.
          </video>
          {msg.text && <p className="media-caption">{msg.text}</p>}
        </div>
      );
    }
    
    if ((msg.message_type === 'audio' || msg.message_type === 'voice') && msg.media_url) {
      return (
        <div className="media-container">
          <audio src={msg.media_url} controls className="media-audio">
            Your browser does not support audio playback.
          </audio>
          {msg.text && <p className="media-caption">{msg.text}</p>}
        </div>
      );
    }
    
    if (msg.message_type === 'file' && msg.media_url) {
      return (
        <div className="media-container">
          <div className="file-info-card">
            <span className="file-icon">📎</span>
            <div>
              <div className="file-name">{msg.file_name || 'Download File'}</div>
              {msg.file_size && (
                <div className="file-size">{(msg.file_size / 1024).toFixed(2)} KB</div>
              )}
            </div>
          </div>
          <a 
            href={msg.media_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="download-btn"
          >
            View/Download File
          </a>
          {msg.text && <p className="media-caption">{msg.text}</p>}
        </div>
      );
    }
    
    return <p className="message-text">{msg.text}</p>;
  };

  return (
    <div className="container">
      {/* Animated Background */}
      <div className="animated-bg">
        <div className="ghost-float ghost-1">👻</div>
        <div className="ghost-float ghost-2">👻</div>
        <div className="ghost-float ghost-3">👻</div>
      </div>

      {/* Modern Header */}
      <header className="modern-header">
        <div className="header-content">
          <div className="user-info">
            <div className="user-avatar">{user.username?.charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <h1 className="user-name">Welcome, {user.username}!</h1>
              <p className="user-phone">Ghost Mode Active • {user.phone}</p>
            </div>
          </div>
          <div className="header-actions">
            <button onClick={() => navigate('/groups')} className="btn-groups">
              <span className="btn-icon">👥</span>
              <span className="btn-text">Groups</span>
            </button>
            <button onClick={handleLogout} className="btn-logout">
              <span className="btn-icon">🚪</span>
              <span className="btn-text">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <div className="main-grid">
        
        {/* Section 1: Send Anonymous Message (Top Full Width) */}
        <div className="section-send glass-card animate-fade-in">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">📤</span>
              Send Anonymous Message
            </h2>
            <div className="section-badge">Ghost Mode</div>
          </div>
          
          <form onSubmit={handleSendMessage} className="modern-form">
            <div className="form-row">
              <div className="input-group">
                <span className="input-icon">📱</span>
                <input
                  type="text"
                  placeholder="Receiver's Phone (+919142945779)"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  required
                  className="modern-input"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="textarea-group">
                <textarea
                  placeholder="Type your secret message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows="3"
                  className="modern-textarea"
                />
              </div>
            </div>

            {/* Recording UI */}
            {isRecording && (
              <div className="recording-indicator animate-pulse">
                <div className="recording-content">
                  <span className="recording-dot"></span>
                  <span className="recording-text">Recording... {formatTime(recordingTime)}</span>
                </div>
                <button type="button" onClick={stopRecording} className="btn-stop">
                  Stop
                </button>
              </div>
            )}

            {/* Audio Preview */}
            {audioURL && !isRecording && (
              <div className="preview-card audio-preview">
                <div className="preview-content">
                  <span className="preview-icon">🎤</span>
                  <div className="preview-details">
                    <div className="preview-title">Voice Message</div>
                    <div className="preview-info">{formatTime(recordingTime)}</div>
                    <audio src={audioURL} controls className="audio-player" />
                  </div>
                  <button type="button" onClick={clearRecording} className="btn-remove">
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* File Preview */}
            {filePreview && !audioURL && (
              <div className="preview-card file-preview">
                {filePreview.type === 'image' ? (
                  <div className="preview-content">
                    <img src={filePreview.url} alt="Preview" className="preview-image" />
                    <div className="preview-details">
                      <span className="preview-title">{filePreview.name}</span>
                      <button type="button" onClick={clearFile} className="btn-remove">
                        ✕
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="preview-content">
                    <span className="preview-icon">
                      {filePreview.type === 'video' && '🎥'}
                      {filePreview.type === 'audio' && '🎵'}
                      {filePreview.type === 'file' && '📎'}
                    </span>
                    <div className="preview-details">
                      <div className="preview-title">{filePreview.name}</div>
                      <div className="preview-info">{filePreview.size}</div>
                    </div>
                    <button type="button" onClick={clearFile} className="btn-remove">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upload Progress */}
            {uploading && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }}>
                    <span className="progress-text">{uploadProgress}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-buttons">
              {!isRecording && !audioURL && (
                <button 
                  type="button"
                  onClick={startRecording}
                  className="btn-action btn-record"
                  disabled={loading || !!selectedFile}
                >
                  <span className="btn-icon">🎤</span>
                  Record
                </button>
              )}
              
              {!audioURL && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden-input"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-action btn-attach"
                    disabled={loading || isRecording}
                  >
                    <span className="btn-icon">📎</span>
                    Attach
                  </button>
                </>
              )}
              
              <button 
                type="submit" 
                disabled={loading || uploading || isRecording} 
                className="btn-action btn-send"
              >
                {loading ? (
                  <span className="loading-spinner"></span>
                ) : (
                  <>
                    <span className="btn-icon">🚀</span>
                    {uploading ? 'Uploading...' : 'Send'}
                  </>
                )}
              </button>
            </div>

            {/* Status Messages */}
            {error && (
              <div className="alert alert-error animate-shake">
                <span className="alert-icon">⚠️</span>
                {error}
              </div>
            )}
            {success && (
              <div className="alert alert-success animate-bounce">
                <span className="alert-icon">✅</span>
                {success}
              </div>
            )}
          </form>
        </div>

        {/* Section 2: 1-to-1 Chats (Bottom Left) */}
        <div className="section-chats glass-card animate-slide-up">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">💬</span>
              1-to-1 Chats
            </h2>
            <div className="chat-count">{messages.length}</div>
          </div>

          <div className="chats-container">
            {messages.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">💭</div>
                <p className="empty-text">No messages yet</p>
                <p className="empty-subtext">Messages will appear here</p>
              </div>
            ) : (
              <div className="chat-list">
                {messages.map((msg, index) => (
                  <div key={msg.message_id} className="chat-item animate-slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="chat-avatar">
                      <span className="avatar-text">{msg.sender_name.charAt(0).toUpperCase()}</span>
                      <span className="online-indicator"></span>
                    </div>
                    <div className="chat-content">
                      <div className="chat-name">{msg.sender_name}</div>
                      <div className="chat-preview">{getMessagePreview(msg)}</div>
                    </div>
                    <button 
                      onClick={() => openMessageViewer(msg)}
                      className="btn-view"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Group Chats (Bottom Right) */}
        <div className="section-groups glass-card animate-slide-up">
          <div className="section-header">
            <h2 className="section-title">
              <span className="title-icon">👥</span>
              Group Chats
            </h2>
            <button 
              onClick={() => navigate('/groups')} 
              className="btn-add-group"
            >
              +
            </button>
          </div>

          <div className="groups-container">
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <p className="empty-text">Join or create groups</p>
              <button 
                onClick={() => navigate('/groups')} 
                className="btn-primary"
              >
                Explore Groups
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Message Viewer Modal */}
      {viewingMessage && (
        <div className="modal-overlay animate-fade-in" onClick={closeMessageViewer}>
          <div className="modal-content glass-modal animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-sender">
                <div className="sender-avatar">
                  {viewingMessage.sender_name.charAt(0).toUpperCase()}
                </div>
                <div className="sender-info">
                  <h3 className="sender-name">{viewingMessage.sender_name}</h3>
                  <p className="sender-phone">{viewingMessage.sender_phone || 'Ghost User'}</p>
                </div>
              </div>
              <div className="countdown-timer">
                <div className="countdown-circle">
                  <svg className="countdown-svg">
                    <circle 
                      className="countdown-path" 
                      cx="20" 
                      cy="20" 
                      r="18"
                      style={{ strokeDashoffset: `${113 - (113 * countdown) / 15}` }}
                    ></circle>
                  </svg>
                  <span className="countdown-text">{countdown}</span>
                </div>
              </div>
            </div>
            
            <div className="modal-body">
              {renderMediaContent(viewingMessage)}
            </div>
            
            <div className="modal-footer">
              <button onClick={closeMessageViewer} className="btn-close-modal">
                Close Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;