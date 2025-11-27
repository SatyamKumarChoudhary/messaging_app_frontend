// ActiveCallScreen.js - Shows during active call
import React, { useEffect, useState, useRef } from 'react';
import { useCall } from '../context/CallContext';
import './CallingStyles.css';

function ActiveCallScreen() {
  const {
    callState,
    currentCall,
    remoteStream,
    isMuted,
    toggleMute,
    endCall,
    connectionState
  } = useCall();

  const [callDuration, setCallDuration] = useState(0);
  const audioRef = useRef(null);

  // Play remote audio
  useEffect(() => {
    if (remoteStream && audioRef.current) {
      console.log('🔊 Playing remote audio stream');
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(err => {
        console.error('❌ Error playing audio:', err);
      });
    }
  }, [remoteStream]);

  // Call duration timer
  useEffect(() => {
    if (callState === 'active' && currentCall?.startTime) {
      const interval = setInterval(() => {
        const duration = Math.floor((new Date() - new Date(currentCall.startTime)) / 1000);
        setCallDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [callState, currentCall]);

  // Format duration as MM:SS
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get connection status display
  const getConnectionStatus = () => {
    if (callState === 'calling') return 'Calling...';
    if (callState === 'ringing') return 'Ringing...';
    if (connectionState === 'connecting') return 'Connecting...';
    if (connectionState === 'connected') return formatDuration(callDuration);
    return 'Connecting...';
  };

  // Don't show if not in a call
  if (callState === 'idle' || callState === 'ended' || !currentCall) {
    return null;
  }

  return (
    <div className="active-call-overlay">
      <div className="active-call-screen">
        {/* Remote audio element (hidden) */}
        <audio ref={audioRef} autoPlay />

        {/* Connection status indicator */}
        <div className={`connection-indicator ${connectionState}`}>
          <div className="status-dot"></div>
          <span className="status-text">
            {connectionState === 'connected' ? 'Connected' : 'Connecting...'}
          </span>
        </div>

        {/* User avatar */}
        <div className="call-user-avatar">
          <div className="avatar-circle">
            <span className="avatar-icon">👻</span>
          </div>
          
          {/* Animated sound waves */}
          {connectionState === 'connected' && !isMuted && (
            <div className="sound-waves">
              <div className="wave"></div>
              <div className="wave"></div>
              <div className="wave"></div>
            </div>
          )}
        </div>

        {/* User info */}
        <h2 className="call-user-name">{currentCall.targetGhostName}</h2>
        <p className="call-duration">{getConnectionStatus()}</p>

        {/* Call controls */}
        <div className="call-controls">
          {/* Mute button */}
          <button
            className={`control-btn ${isMuted ? 'active' : ''}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            disabled={callState !== 'active'}
          >
            <span className="control-icon">
              {isMuted ? '🔇' : '🎤'}
            </span>
            <span className="control-label">
              {isMuted ? 'Unmute' : 'Mute'}
            </span>
          </button>

          {/* End call button */}
          <button
            className="control-btn end-call-btn"
            onClick={endCall}
            title="End call"
          >
            <span className="control-icon">📴</span>
            <span className="control-label">End Call</span>
          </button>
        </div>

        {/* Connection quality info */}
        {connectionState === 'connected' && (
          <div className="call-info">
            <p className="info-text">
              <span className="info-icon">🔐</span>
              End-to-end encrypted
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActiveCallScreen;