import React, { useState, useEffect } from 'react';

function ResendTimer({ duration = 60, onResend, disabled = false }) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setTimeLeft(duration);
    setIsActive(true);
  }, [duration]);

  useEffect(() => {
    let interval = null;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft]);

  const handleResend = () => {
    if (!disabled && timeLeft === 0) {
      setTimeLeft(duration);
      setIsActive(true);
      if (onResend) onResend();
    }
  };

  const progress = ((duration - timeLeft) / duration) * 100;
  const canResend = timeLeft === 0 && !disabled;

  return (
    <div style={styles.container}>
      {timeLeft > 0 ? (
        <div style={styles.countdownContainer}>
          {/* Visual Progress Circle */}
          <div style={styles.progressCircle}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="rgba(120, 119, 198, 0.2)"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#7877c6"
                strokeWidth="2"
                strokeDasharray={`${progress * 0.628} 62.8`}
                strokeDashoffset="0"
                transform="rotate(-90 12 12)"
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
          </div>
          
          <span style={styles.countdownText}>
            Resend in <strong>{timeLeft}s</strong>
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={disabled}
          style={{
            ...styles.resendButton,
            ...(canResend ? styles.resendButtonActive : styles.resendButtonDisabled)
          }}
        >
          🔄 Resend OTP
        </button>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '12px 0'
  },
  countdownContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#a0a0c0',
    fontSize: '14px'
  },
  progressCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  countdownText: {
    color: '#a0a0c0'
  },
  resendButton: {
    padding: '10px 24px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    outline: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  resendButtonActive: {
    backgroundColor: '#7877c6',
    color: 'white',
    border: '1px solid #7877c6',
    transform: 'scale(1)',
    ':hover': {
      transform: 'scale(1.05)',
      boxShadow: '0 4px 12px rgba(120, 119, 198, 0.4)'
    }
  },
  resendButtonDisabled: {
    backgroundColor: 'rgba(120, 119, 198, 0.2)',
    color: '#6b6b8f',
    border: '1px solid rgba(120, 119, 198, 0.2)',
    cursor: 'not-allowed'
  }
};

export default ResendTimer;