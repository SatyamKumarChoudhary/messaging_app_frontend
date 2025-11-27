// CallButton.js - Reusable button to initiate calls
import React from 'react';
import { useCall } from '../context/CallContext';
import './CallingStyles.css';

function CallButton({ targetGhostName, disabled = false, size = 'medium' }) {
  const { initiateCall, callState } = useCall();

  const handleCall = () => {
    if (disabled || callState !== 'idle') return;
    
    if (!targetGhostName) {
      alert('Please select a recipient to call');
      return;
    }

    initiateCall(targetGhostName);
  };

  // Don't show button if already in a call
  if (callState !== 'idle') {
    return null;
  }

  return (
    <button
      onClick={handleCall}
      disabled={disabled || !targetGhostName}
      className={`call-button call-button-${size}`}
      title={`Call ${targetGhostName || 'user'}`}
    >
      <span className="call-icon">📞</span>
      {size === 'large' && <span className="call-text">Voice Call</span>}
    </button>
  );
}

export default CallButton;