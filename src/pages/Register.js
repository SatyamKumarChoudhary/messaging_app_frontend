import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import CountryCodeDropdown from '../components/CountryCodeDropdown';
import OTPInput from '../components/OTPInput';
import ResendTimer from '../components/ResendTimer';

function Register() {
  // Step management
  const [step, setStep] = useState(1); // 1: Phone, 2: OTP, 3: Profile
  
  // Country & Phone
  const [selectedCountry, setSelectedCountry] = useState({ code: '+91', name: 'India', flag: '🇮🇳' });
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullPhoneNumber, setFullPhoneNumber] = useState('');
  
  // OTP State
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState(false);
  
  // Profile Data
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    ghost_name: '',
    bio: ''
  });
  
  // UI States
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState(null);
  const [idToken, setIdToken] = useState('');
  
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

  // STEP 1: Send OTP
  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setStep(2); // Move to OTP verification
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

  // STEP 2: Verify OTP
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
      const token = await user.getIdToken();
      
      setIdToken(token);
      setOtpSuccess(true);
      setOtpError('');
      
      // Move to profile step after short delay
      setTimeout(() => {
        setStep(3);
      }, 1000);
      
    } catch (err) {
      console.error('Error verifying OTP:', err);
      setOtpError('Invalid OTP. Please try again.');
      setOtpSuccess(false);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // Auto-verify when OTP is complete
  const handleOTPComplete = (otpValue) => {
    setOtp(otpValue);
    // Auto-verify will be handled by user clicking verify button
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

  // Change phone number (go back to step 1)
  const handleChangeNumber = () => {
    setStep(1);
    setOtp('');
    setOtpError('');
    setOtpSuccess(false);
    setConfirmationResult(null);
  };

  // Handle form input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Handle ghost name input (auto-add Ghost_ prefix)
  const handleGhostNameChange = (e) => {
    let value = e.target.value;
    
    if (value && !value.startsWith('Ghost_')) {
      value = 'Ghost_' + value.replace(/^Ghost_/, '');
    }
    
    setFormData({
      ...formData,
      ghost_name: value
    });
  };

  // Generate random ghost name
  const generateGhostName = () => {
    const suggestions = [
      'Phantom', 'Shadow', 'Mystery', 'Silent', 'Dark', 'Night',
      'Mystic', 'Echo', 'Void', 'Cipher', 'Enigma', 'Raven',
      'Whisper', 'Spirit', 'Specter', 'Wraith', 'Shade'
    ];
    const random = suggestions[Math.floor(Math.random() * suggestions.length)];
    const number = Math.floor(Math.random() * 9999);
    
    setFormData({
      ...formData,
      ghost_name: `Ghost_${random}${number}`
    });
  };

  // STEP 3: Complete Registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate ghost name
    if (!formData.ghost_name.startsWith('Ghost_')) {
      setError('Ghost name must start with "Ghost_"');
      setLoading(false);
      return;
    }

    if (formData.ghost_name.length < 8) {
      setError('Ghost name must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/register-with-otp`,
        {
          idToken,
          username: formData.username,
          ghost_name: formData.ghost_name,
          email: formData.email,
          password: formData.password
        }
      );
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Redirect to home page
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* STEP 1: PHONE NUMBER ENTRY */}
        {step === 1 && (
          <>
            <div style={styles.header}>
              <h1 style={styles.title}>👻 Create Ghost</h1>
              <p style={styles.subtitle}>Join the anonymous world</p>
              <div style={styles.stepIndicator}>Step 1 of 3</div>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleSendOTP(); }} style={styles.form}>
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
                  Will be formatted as: {fullPhoneNumber || `${selectedCountry.code} XXXXXXXXXX`}
                </small>
              </div>
              
              {error && <p style={styles.error}>{error}</p>}
              
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Sending OTP...' : '📤 Send OTP Code'}
              </button>
            </form>
            
            <p style={styles.link}>
              Already have an account? <a href="/login" style={styles.linkText}>Login here</a>
            </p>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 2 && (
          <>
            <div style={styles.header}>
              <h1 style={styles.title}>🔐 Verify Phone</h1>
              <p style={styles.subtitle}>Code sent to {fullPhoneNumber}</p>
              <button 
                type="button" 
                onClick={handleChangeNumber}
                style={styles.changeNumber}
              >
                Change number
              </button>
              <div style={styles.stepIndicator}>Step 2 of 3</div>
            </div>
            
            <div style={styles.form}>
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
              {otpSuccess && <p style={styles.success}>✓ Phone verified!</p>}
              
              <button 
                type="button"
                onClick={handleVerifyOTP}
                disabled={loading || otp.length !== 6}
                style={{
                  ...styles.button,
                  ...(otp.length !== 6 ? styles.buttonDisabled : {})
                }}
              >
                {loading ? 'Verifying...' : '✓ Verify & Continue'}
              </button>
            </div>
          </>
        )}

        {/* STEP 3: COMPLETE PROFILE */}
        {step === 3 && (
          <>
            <div style={styles.header}>
              <h1 style={styles.title}>✅ Phone Verified!</h1>
              <p style={styles.subtitle}>Complete your ghost profile</p>
              <div style={styles.stepIndicator}>Step 3 of 3</div>
            </div>
            
            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Username (Private)</label>
                <input
                  type="text"
                  name="username"
                  placeholder="Your real username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              
              <div style={styles.ghostSection}>
                <label style={styles.ghostLabel}>
                  👻 Your Ghost Identity (Public - Others see this)
                </label>
                <input
                  type="text"
                  name="ghost_name"
                  placeholder="Ghost_YourName"
                  value={formData.ghost_name}
                  onChange={handleGhostNameChange}
                  required
                  style={{...styles.input, ...styles.ghostInput}}
                  maxLength={50}
                />
                <button 
                  type="button" 
                  onClick={generateGhostName}
                  style={styles.generateBtn}
                >
                  🎲 Generate Random Ghost Name
                </button>
                <p style={styles.hint}>
                  ⚠️ This is your permanent anonymous identity. Choose wisely!
                </p>
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.inputGroup}>
                <label style={styles.label}>Bio (Optional)</label>
                <textarea
                  name="bio"
                  placeholder="Tell others about yourself... (optional)"
                  value={formData.bio}
                  onChange={handleChange}
                  style={{...styles.input, ...styles.textarea}}
                  maxLength={200}
                  rows={3}
                />
                <small style={styles.charCount}>
                  {formData.bio.length}/200 characters
                </small>
              </div>
              
              {error && <p style={styles.error}>{error}</p>}
              
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Creating Ghost Identity...' : '👻 Create Ghost Account'}
              </button>
            </form>
          </>
        )}
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
    maxWidth: '500px',
    border: '1px solid rgba(120, 119, 198, 0.2)',
    animation: 'fadeIn 0.5s ease'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
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
    fontSize: '14px',
    marginBottom: '12px'
  },
  stepIndicator: {
    display: 'inline-block',
    backgroundColor: 'rgba(120, 119, 198, 0.2)',
    color: '#7877c6',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '10px'
  },
  changeNumber: {
    background: 'none',
    border: 'none',
    color: '#7877c6',
    cursor: 'pointer',
    fontSize: '13px',
    textDecoration: 'underline',
    padding: '8px',
    marginTop: '8px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#a0a0c0'
  },
  input: {
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid rgba(120, 119, 198, 0.3)',
    borderRadius: '8px',
    outline: 'none',
    backgroundColor: '#16213e',
    color: '#fff',
    transition: 'border-color 0.3s'
  },
  textarea: {
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'Arial, sans-serif',
    lineHeight: '1.5'
  },
  charCount: {
    fontSize: '11px',
    color: '#a0a0c0',
    textAlign: 'right',
    marginTop: '2px'
  },
  hint: {
    fontSize: '12px',
    color: '#a0a0c0',
    marginTop: '4px'
  },
  ghostSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    padding: '20px',
    backgroundColor: 'rgba(120, 119, 198, 0.1)',
    borderRadius: '12px',
    border: '2px solid rgba(120, 119, 198, 0.4)'
  },
  ghostLabel: {
    color: '#7877c6',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  ghostInput: {
    fontSize: '16px',
    fontWeight: '600',
    backgroundColor: '#0f0f23',
    border: '2px solid #7877c6'
  },
  generateBtn: {
    padding: '10px',
    backgroundColor: '#7877c6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background-color 0.3s'
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

export default Register;