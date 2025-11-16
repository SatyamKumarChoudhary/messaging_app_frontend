// src/pages/OTPTest.js

import React, { useState } from 'react';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import axios from 'axios';

function OTPTest() {
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Result
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [result, setResult] = useState(null);

  // Initialize reCAPTCHA
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          setError('reCAPTCHA expired. Please try again.');
        }
      });
    }
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
      console.log('✅ OTP sent successfully');
    } catch (err) {
      console.error('❌ Send OTP error:', err);
      setError(err.message || 'Failed to send OTP');
      window.recaptchaVerifier = null;
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Verify OTP with Firebase
      const userCredential = await confirmationResult.confirm(otp);
      console.log('✅ OTP verified with Firebase:', userCredential);

      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      console.log('🔑 Got ID token');

      // Send to your backend
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/otp/verify`,
        { idToken },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Backend response:', response.data);
      setResult(response.data);
      setStep(3);

    } catch (err) {
      console.error('❌ Verify OTP error:', err);
      setError(err.response?.data?.message || err.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const handleReset = () => {
    setStep(1);
    setPhoneNumber('+91');
    setOtp('');
    setError('');
    setResult(null);
    setConfirmationResult(null);
    window.recaptchaVerifier = null;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🔐 OTP Test</h1>
        <p style={styles.subtitle}>Test Firebase Phone Authentication</p>

        {/* Step 1: Phone Number */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>📱 Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+919876543210"
                required
                style={styles.input}
              />
              <small style={styles.hint}>
                Format: +91 followed by 10 digits
              </small>
            </div>

            {/* reCAPTCHA Container */}
            <div id="recaptcha-container"></div>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Sending OTP...' : '📤 Send OTP'}
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} style={styles.form}>
            <div style={styles.successBox}>
              <p style={styles.successText}>
                ✅ OTP sent to {phoneNumber}
              </p>
              <small style={styles.hint}>Check your phone for the code</small>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>🔢 Enter OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                required
                maxLength="6"
                style={styles.otpInput}
                autoFocus
              />
            </div>

            {error && <p style={styles.error}>{error}</p>}

            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Verifying...' : '✅ Verify OTP'}
            </button>

            <button 
              type="button" 
              onClick={handleReset} 
              style={styles.secondaryButton}
            >
              ← Back
            </button>
          </form>
        )}

        {/* Step 3: Result */}
        {step === 3 && result && (
          <div style={styles.resultContainer}>
            <div style={styles.successBox}>
              <h2 style={styles.resultTitle}>🎉 Authentication Successful!</h2>
            </div>

            <div style={styles.resultBox}>
              {result.isNewUser ? (
                <>
                  <p style={styles.resultLabel}>🆕 New User Detected</p>
                  <p style={styles.resultValue}>{result.phone}</p>
                  <p style={styles.hint}>
                    Next step: Complete registration with username and other details
                  </p>
                </>
              ) : (
                <>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>👤 User ID:</span>
                    <span style={styles.resultValue}>{result.user.id}</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>📱 Phone:</span>
                    <span style={styles.resultValue}>{result.user.phone}</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>🏷️ Username:</span>
                    <span style={styles.resultValue}>{result.user.username}</span>
                  </div>
                  <div style={styles.resultRow}>
                    <span style={styles.resultLabel}>🔑 JWT Token:</span>
                    <span style={styles.tokenValue}>
                      {result.token.substring(0, 50)}...
                    </span>
                  </div>
                </>
              )}
            </div>

            <button onClick={handleReset} style={styles.button}>
              🔄 Test Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    padding: '20px',
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1), transparent 50%)'
  },
  card: {
    backgroundColor: '#1a1a2e',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(120, 119, 198, 0.2)',
    width: '100%',
    maxWidth: '500px',
    border: '1px solid rgba(120, 119, 198, 0.2)'
  },
  title: {
    margin: '0 0 8px 0',
    color: '#fff',
    fontSize: '32px',
    fontWeight: '700',
    textAlign: 'center'
  },
  subtitle: {
    margin: '0 0 30px 0',
    color: '#a0a0c0',
    fontSize: '14px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#7877c6'
  },
  input: {
    padding: '14px',
    fontSize: '16px',
    border: '1px solid rgba(120, 119, 198, 0.3)',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#16213e',
    color: '#fff'
  },
  otpInput: {
    padding: '14px',
    fontSize: '24px',
    border: '2px solid #7877c6',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#16213e',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: '8px',
    fontWeight: 'bold'
  },
  hint: {
    fontSize: '12px',
    color: '#a0a0c0',
    fontStyle: 'italic'
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    backgroundColor: '#7877c6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  secondaryButton: {
    padding: '12px',
    fontSize: '14px',
    backgroundColor: 'transparent',
    color: '#7877c6',
    border: '1px solid #7877c6',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  error: {
    color: '#ff6b6b',
    fontSize: '14px',
    textAlign: 'center',
    margin: 0,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    padding: '12px',
    borderRadius: '8px'
  },
  successBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center'
  },
  successText: {
    color: '#10b981',
    fontSize: '16px',
    fontWeight: '600',
    margin: '0 0 8px 0'
  },
  resultContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  resultTitle: {
    color: '#10b981',
    fontSize: '20px',
    margin: 0
  },
  resultBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    padding: '20px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  resultRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '10px'
  },
  resultLabel: {
    fontSize: '14px',
    color: '#a0a0c0',
    fontWeight: '600'
  },
  resultValue: {
    fontSize: '14px',
    color: '#fff',
    fontWeight: '500'
  },
  tokenValue: {
    fontSize: '12px',
    color: '#7877c6',
    fontFamily: 'monospace',
    wordBreak: 'break-all'
  }
};

export default OTPTest;