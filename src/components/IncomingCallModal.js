// IncomingCallModal.js - Shows incoming call popup
import React, { useEffect, useState } from 'react';
import { useCall } from '../context/CallContext';
import './CallingStyles.css';

function IncomingCallModal() {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const [ringCount, setRingCount] = useState(0);

  // Animate ringing
  useEffect(() => {
    if (incomingCall) {
      const interval = setInterval(() => {
        setRingCount(prev => (prev + 1) % 3);
      }, 500);

      // Auto-decline after 30 seconds
      const timeout = setTimeout(() => {
        console.log('⏱️ Call timeout - auto declining');
        declineCall();
      }, 30000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [incomingCall, declineCall]);

  if (!incomingCall) return null;

  return (
    <div className="incoming-call-overlay">
      <div className="incoming-call-modal">
        {/* Animated rings */}
        <div className="call-rings">
          <div className={`ring ring-1 ${ringCount >= 0 ? 'active' : ''}`}></div>
          <div className={`ring ring-2 ${ringCount >= 1 ? 'active' : ''}`}></div>
          <div className={`ring ring-3 ${ringCount >= 2 ? 'active' : ''}`}></div>
        </div>

        {/* Caller avatar */}
        <div className="caller-avatar">
          <span className="avatar-icon">👻</span>
        </div>

        {/* Caller info */}
        <h2 className="caller-name">{incomingCall.callerGhostName}</h2>
        <p className="call-status">Incoming voice call...</p>

        {/* Action buttons */}
        <div className="call-actions">
          <button 
            className="call-btn decline-btn"
            onClick={declineCall}
            title="Decline call"
          >
            <span className="btn-icon">✖️</span>
            <span className="btn-text">Decline</span>
          </button>

          <button 
            className="call-btn accept-btn"
            onClick={acceptCall}
            title="Accept call"
          >
            <span className="btn-icon">📞</span>
            <span className="btn-text">Accept</span>
          </button>
        </div>

        {/* Auto-decline warning */}
        <p className="call-timeout-warning">
          Call will auto-decline in 30 seconds
        </p>
      </div>
    </div>
  );
}

export default IncomingCallModal;