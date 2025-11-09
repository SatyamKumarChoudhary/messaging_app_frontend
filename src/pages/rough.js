import React, { useState, useEffect, useRef } from 'react';
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
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      setError('');
      
      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 60) { // Max 60 seconds
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

    // Clear any existing recording
    clearRecording();

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size must be less than 50MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview for images
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
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/media/upload`,
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

      // If voice recording exists, upload it first
      if (audioBlob) {
        setUploading(true);
        
        // Convert blob to file
        const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, {
          type: 'audio/webm'
        });
        
        const uploadResult = await uploadFileToS3(audioFile);
        
        messageData.message_type = 'audio';
        messageData.media_url = uploadResult.media_url;
        messageData.file_name = uploadResult.file_name;
        messageData.file_size = uploadResult.file_size;
        
        // Add text as caption if provided
        if (message.trim()) {
          messageData.text = message;
        }
      }
      // If file is selected, upload it
      else if (selectedFile) {
        setUploading(true);
        const uploadResult = await uploadFileToS3(selectedFile);
        
        messageData.message_type = uploadResult.message_type;
        messageData.media_url = uploadResult.media_url;
        messageData.file_name = uploadResult.file_name;
        messageData.file_size = uploadResult.file_size;
        
        // Add text as caption if provided
        if (message.trim()) {
          messageData.text = message;
        }
      } else {
        // Text-only message
        if (!message.trim()) {
          setError('Please enter a message, record voice, or select a file');
          setLoading(false);
          return;
        }
        messageData.text = message;
      }

      // Send message
      await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/messages/send`,
        messageData,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      setSuccess(audioBlob ? 'Voice message sent!' : selectedFile ? 'Media sent!' : 'Message sent!');
      setReceiver('');
      setMessage('');
      clearFile();
      clearRecording();
      setUploadProgress(0);
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

  // Helper function to format recording time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
            alt="Shared content" 
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
      {/* Header - UPDATED WITH GROUPS BUTTON */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📨 Welcome, {user.username}!</h1>
          <p style={styles.subtitle}>Your number: {user.phone}</p>
        </div>
        <div style={styles.headerButtons}>
          <button onClick={() => navigate('/groups')} style={styles.groupsButton}>
            👥 Groups
          </button>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>
      </div>

      {/* Send Message */}
      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>📤 Send Message</h2>
        <form onSubmit={handleSendMessage} style={styles.form}>
          <input
            type="text"
            placeholder="Receiver's Phone Number (+919142945779)"
            value={receiver}
            onChange={(e) => setReceiver(e.target.value)}
            required
            style={styles.input}
          />
          
          <textarea
            placeholder="Type your message... (optional if you attach media)"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows="3"
            style={styles.textarea}
          />

          {/* Recording UI */}
          {isRecording && (
            <div style={styles.recordingContainer}>
              <div style={styles.recordingIndicator}>
                <span style={styles.recordingDot}>🔴</span>
                <span style={styles.recordingText}>Recording... {formatTime(recordingTime)}</span>
              </div>
              <button 
                type="button" 
                onClick={stopRecording} 
                style={styles.stopBtn}
              >
                ⏹️ Stop
              </button>
            </div>
          )}

          {/* Recorded Audio Preview */}
          {audioURL && !isRecording && (
            <div style={styles.filePreviewContainer}>
              <div style={styles.audioPreview}>
                <span style={styles.audioIcon}>🎤</span>
                <div style={styles.audioInfo}>
                  <div style={styles.audioTitle}>Voice Message</div>
                  <div style={styles.audioDuration}>{formatTime(recordingTime)}</div>
                  <audio src={audioURL} controls style={styles.audioPlayer} />
                </div>
                <button 
                  type="button" 
                  onClick={clearRecording} 
                  style={styles.removeFileBtn}
                >
                  ❌ Remove
                </button>
              </div>
            </div>
          )}

          {/* File Preview */}
          {filePreview && !audioURL && (
            <div style={styles.filePreviewContainer}>
              {filePreview.type === 'image' ? (
                <div style={styles.imagePreview}>
                  <img src={filePreview.url} alt="Preview" style={styles.previewImage} />
                  <div style={styles.previewInfo}>
                    <span style={styles.previewFileName}>{filePreview.name}</span>
                    <button 
                      type="button" 
                      onClick={clearFile} 
                      style={styles.removeFileBtn}
                    >
                      ❌ Remove
                    </button>
                  </div>
                </div>
              ) : (
                <div style={styles.filePreviewInfo}>
                  <div style={styles.filePreviewIcon}>
                    {filePreview.type === 'video' && '🎥'}
                    {filePreview.type === 'audio' && '🎵'}
                    {filePreview.type === 'file' && '📎'}
                  </div>
                  <div style={styles.filePreviewDetails}>
                    <div style={styles.previewFileName}>{filePreview.name}</div>
                    <div style={styles.previewFileSize}>{filePreview.size}</div>
                  </div>
                  <button 
                    type="button" 
                    onClick={clearFile} 
                    style={styles.removeFileBtn}
                  >
                    ❌ Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div style={styles.progressContainer}>
              <div style={styles.progressBar}>
                <div 
                  style={{...styles.progressFill, width: `${uploadProgress}%`}}
                />
              </div>
              <span style={styles.progressText}>{uploadProgress}%</span>
            </div>
          )}

          {/* Buttons Row */}
          <div style={styles.buttonRow}>
            {!isRecording && !audioURL && (
              <button 
                type="button"
                onClick={startRecording}
                style={styles.recordBtn}
                disabled={loading || !!selectedFile}
              >
                🎤 Record Voice
              </button>
            )}
            
            {!audioURL && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  style={styles.hiddenInput}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={styles.attachBtn}
                  disabled={loading || isRecording}
                >
                  📎 Attach File
                </button>
              </>
            )}
            
            <button 
              type="submit" 
              disabled={loading || uploading || isRecording} 
              style={styles.sendBtn}
            >
              {loading ? 'Sending...' : uploading ? 'Uploading...' : 'Send Message'}
            </button>
          </div>

          {error && <p style={styles.error}>{error}</p>}
          {success && <p style={styles.success}>{success}</p>}
        </form>
      </div>

      {/* Received Messages */}
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
  subtitle: {
    color: '#666',
    fontSize: '14px',
    margin: '5px 0 0 0'
  },
  headerButtons: {  // NEW
    display: 'flex',
    gap: '10px'
  },
  groupsButton: {  // NEW
    padding: '10px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
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
  buttonRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap'
  },
  hiddenInput: {
    display: 'none'
  },
  recordBtn: {
    padding: '12px 20px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: '0 0 auto'
  },
  attachBtn: {
    padding: '12px 20px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    flex: '0 0 auto'
  },
  sendBtn: {
    padding: '12px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    flex: 1
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
  // Recording UI
  recordingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '8px',
    border: '2px solid #ffc107'
  },
  recordingIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  recordingDot: {
    fontSize: '20px',
    animation: 'pulse 1s infinite'
  },
  recordingText: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  stopBtn: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  // Audio Preview
  audioPreview: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  audioIcon: {
    fontSize: '40px'
  },
  audioInfo: {
    flex: 1
  },
  audioTitle: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
    marginBottom: '4px'
  },
  audioDuration: {
    fontSize: '12px',
    color: '#666',
    marginBottom: '8px'
  },
  audioPlayer: {
    width: '100%',
    maxWidth: '300px'
  },
  // File Preview
  filePreviewContainer: {
    border: '2px solid #007bff',
    borderRadius: '8px',
    padding: '15px',
    backgroundColor: '#f8f9fa'
  },
  imagePreview: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  previewImage: {
    maxWidth: '200px',
    maxHeight: '200px',
    borderRadius: '8px',
    objectFit: 'cover'
  },
  previewInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  filePreviewInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  filePreviewIcon: {
    fontSize: '40px'
  },
  filePreviewDetails: {
    flex: 1
  },
  previewFileName: {
    fontWeight: 'bold',
    fontSize: '14px',
    color: '#333',
    wordBreak: 'break-word'
  },
  previewFileSize: {
    fontSize: '12px',
    color: '#666',
    marginTop: '4px'
  },
  removeFileBtn: {
    padding: '6px 12px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  progressBar: {
    flex: 1,
    height: '20px',
    backgroundColor: '#e9ecef',
    borderRadius: '10px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007bff',
    transition: 'width 0.3s ease'
  },
  progressText: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#007bff'
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
    borderRadius: '8px'
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
    overflow: 'auto'
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