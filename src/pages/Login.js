import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import CountryCodeDropdown from '../components/CountryCodeDropdown';
import OTPInput from '../components/OTPInput';
import ResendTimer from '../components/ResendTimer';

function Login() {
  // Login mode: 'password' or 'otp'
  const [loginMode, setLoginMode] = useState('password');
  
  // Country & Phone
  const [selectedCountry, setSelectedCountry] = useState({ code: '+91', name: 'India', flag: '🇮🇳' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  
  // Password login
  const [password, setPassword] = useState('');
  
  // OTP State
  const [otpStep, setOtpStep] = useState(1); // 1: Send OTP, 2: Verify OTP
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  
  // UI States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  
  const navigate = useNavigate();

  // Initialize reCAPTCHA on mount
  useEffect(() => {
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        console.log('reCAPTCHA verified');
      }
    });
    setRecaptchaVerifier(verifier);

    return () => {
      if (verifier) {
        verifier.clear();
      }
    };
  }, []);

  // Update full phone number when country or phone changes
  useEffect(() => {
    if (phoneNumber) {
      setFullPhoneNumber(selectedCountry.code + phoneNumber);
    } else {
      setFullPhoneNumber('');
    }
  }, [selectedCountry, phoneNumber]);

  // Reset states when switching modes
  const handleModeSwitch = (mode) => {
    setLoginMode(mode);
    setError('');
    setOtpError('');
    setOtp('');
    setPassword('');
    setOtpStep(1);
    setOtpSuccess(false);
  };

  // PASSWORD LOGIN
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate phone format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(fullPhoneNumber)) {
      setError('Invalid phone number. Must be 10 digits starting with 6-9');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/login`,
        {
          phone: fullPhoneNumber,
          password: password
        }
      );
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to home page
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // OTP LOGIN - Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setOtpStep(2); // Move to OTP verification
      setError('');
    } catch (err) {
      console.error('Error sending OTP:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
      
      // Reset reCAPTCHA on error
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        const newVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible'
        });
        setRecaptchaVerifier(newVerifier);
      }
    } finally {
      setLoading(false);
    }
  };

  // OTP LOGIN - Verify OTP and Login
  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError('Please enter the 6-digit code');
      return;
    }

    setOtpError('');
    setLoading(true);

    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const idToken = await user.getIdToken();
      
      // Call backend login-with-otp endpoint
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/login-with-otp`,
        { idToken }
      );
      
      setOtpSuccess(true);
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to home page after short delay
      setTimeout(() => {
        navigate('/home');
      }, 1000);
      
    } catch (err) {
      console.error('Error verifying OTP:', err);
      if (err.response?.data?.error) {
        setOtpError(err.response.data.error);
      } else {
        setOtpError('Invalid OTP. Please try again.');
      }
      setOtpSuccess(false);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when OTP is complete
  const handleOTPComplete = (otpValue) => {
    setOtp(otpValue);
  };

  // Resend OTP
  const handleResendOTP = async () => {
    setOtp('');
    setOtpError('');
    setLoading(true);

    try {
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setError('');
    } catch (err) {
      console.error('Error resending OTP:', err);
      setOtpError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Change phone number in OTP mode
  const handleChangeNumber = () => {
    setOtpStep(1);
    setOtp('');
    setOtpError('');
    setOtpSuccess(false);
    setConfirmationResult(null);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>👻 Welcome Back</h1>
          <p style={styles.subtitle}>Enter as your ghost identity</p>
        </div>

        {/* MODE TOGGLE */}
        <div style={styles.toggleContainer}>
          <button
            type="button"
            onClick={() => handleModeSwitch('password')}
            style={{
              ...styles.toggleButton,
              ...(loginMode === 'password' ? styles.toggleButtonActive : {})
            }}
          >
            🔒 Password
          </button>
          <button
            type="button"
            onClick={() => handleModeSwitch('otp')}
            style={{
              ...styles.toggleButton,
              ...(loginMode === 'otp' ? styles.toggleButtonActive : {})
            }}
          >
            📱 OTP Login
          </button>
        </div>

        {/* PASSWORD LOGIN MODE */}
        {loginMode === 'password' && (
          <form onSubmit={handlePasswordLogin} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>🌍 Country</label>
              <CountryCodeDropdown
                value={selectedCountry}
                onChange={setSelectedCountry}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>📱 Phone Number</label>
              <input
                type="tel"
                placeholder="9876543210"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                style={styles.input}
              />
              <small style={styles.hint}>
                Format: {fullPhoneNumber || `${selectedCountry.code} XXXXXXXXXX`}
              </small>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>🔒 Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>
            
            {error && <p style={styles.error}>{error}</p>}
            
            <button type="submit" disabled={loading} style={styles.button}>
              {loading ? 'Logging in...' : '👻 Enter as Ghost'}
            </button>
          </form>
        )}

        {/* OTP LOGIN MODE */}
        {loginMode === 'otp' && (
          <>
            {/* OTP Step 1: Send OTP */}
            {otpStep === 1 && (
              <form onSubmit={handleSendOTP} style={styles.form}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>🌍 Country</label>
                  <CountryCodeDropdown
                    value={selectedCountry}
                    onChange={setSelectedCountry}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>📱 Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    style={styles.input}
                  />
                  <small style={styles.hint}>
                    We'll send a 6-digit code to: {fullPhoneNumber || `${selectedCountry.code} XXXXXXXXXX`}
                  </small>
                </div>
                
                {error && <p style={styles.error}>{error}</p>}
                
                <button type="submit" disabled={loading} style={styles.button}>
                  {loading ? 'Sending OTP...' : '📤 Send OTP Code'}
                </button>
              </form>
            )}

            {/* OTP Step 2: Verify OTP */}
            {otpStep === 2 && (
              <div style={styles.form}>
                <div style={styles.otpHeader}>
                  <p style={styles.otpSentText}>Code sent to {fullPhoneNumber}</p>
                  <button 
                    type="button" 
                    onClick={handleChangeNumber}
                    style={styles.changeNumber}
                  >
                    Change number
                  </button>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Enter 6-digit code:</label>
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleOTPComplete}
                    error={!!otpError}
                    success={otpSuccess}
                  />
                </div>
                
                <ResendTimer
                  duration={60}
                  onResend={handleResendOTP}
                  disabled={loading}
                />
                
                {otpError && <p style={styles.error}>{otpError}</p>}
                {otpSuccess && <p style={styles.success}>✓ Logging in...</p>}
                
                <button 
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={loading || otp.length !== 6}
                  style={{
                    ...styles.button,
                    ...(otp.length !== 6 ? styles.buttonDisabled : {})
                  }}
                >
                  {loading ? 'Verifying...' : '✓ Verify & Login'}
                </button>
              </div>
            )}
          </>
        )}
        
        <p style={styles.link}>
          Don't have an account? <a href="/register" style={styles.linkText}>Create Ghost Identity</a>
        </p>
      </div>

      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f0f23',
    fontFamily: 'Arial, sans-serif',
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1), transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 119, 198, 0.1), transparent 50%)',
    padding: '20px'
  },
  card: {
    backgroundColor: '#1a1a2e',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(120, 119, 198, 0.2)',
    width: '100%',
    maxWidth: '450px',
    border: '1px solid rgba(120, 119, 198, 0.2)',
    animation: 'fadeIn 0.5s ease'
  },
  header: {
    textAlign: 'center',
    marginBottom: '25px'
  },
  title: {
    margin: 0,
    marginBottom: '8px',
    color: '#fff',
    fontSize: '32px',
    fontWeight: '700'
  },
  subtitle: {
    margin: 0,
    color: '#a0a0c0',
    fontSize: '14px'
  },
  toggleContainer: {
    display: 'flex',
    gap: '12px',
    marginBottom: '25px',
    backgroundColor: '#16213e',
    padding: '6px',
    borderRadius: '10px'
  },
  toggleButton: {
    flex: 1,
    padding: '12px',
    fontSize: '14px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: '#a0a0c0',
    transition: 'all 0.3s',
    outline: 'none'
  },
  toggleButtonActive: {
    backgroundColor: '#7877c6',
    color: 'white',
    boxShadow: '0 4px 12px rgba(120, 119, 198, 0.3)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#a0a0c0'
  },
  input: {
    padding: '14px',
    fontSize: '16px',
    border: '1px solid rgba(120, 119, 198, 0.3)',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#16213e',
    color: '#fff',
    transition: 'border-color 0.3s'
  },
  hint: {
    fontSize: '12px',
    color: '#a0a0c0',
    marginTop: '2px'
  },
  otpHeader: {
    textAlign: 'center',
    marginBottom: '15px'
  },
  otpSentText: {
    color: '#a0a0c0',
    fontSize: '14px',
    margin: '0 0 8px 0'
  },
  changeNumber: {
    background: 'none',
    border: 'none',
    color: '#7877c6',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
    padding: '4px'
  },
  button: {
    padding: '14px',
    fontSize: '16px',
    backgroundColor: '#7877c6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px',
    transition: 'all 0.3s'
  },
  buttonDisabled: {
    backgroundColor: 'rgba(120, 119, 198, 0.3)',
    cursor: 'not-allowed'
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
  success: {
    color: '#4ecdc4',
    fontSize: '14px',
    textAlign: 'center',
    margin: 0,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    padding: '12px',
    borderRadius: '8px'
  },
  link: {
    textAlign: 'center',
    marginTop: '24px',
    fontSize: '14px',
    color: '#a0a0c0'
  },
  linkText: {
    color: '#7877c6',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Animation already exists
  }
}

export default Login;