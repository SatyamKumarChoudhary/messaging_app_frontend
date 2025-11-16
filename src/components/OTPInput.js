import React, { useState, useRef, useEffect } from 'react';

function OTPInput({ length = 6, value, onChange, onComplete, error = false, success = false }) {
  const [otp, setOtp] = useState(new Array(length).fill(''));
  const inputRefs = useRef([]);

  // Update internal state when value prop changes
  useEffect(() => {
    if (value) {
      const otpArray = value.split('').slice(0, length);
      while (otpArray.length < length) {
        otpArray.push('');
      }
      setOtp(otpArray);
    }
  }, [value, length]);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const handleChange = (index, e) => {
    const val = e.target.value;

    // Only allow numbers
    if (val && !/^\d+$/.test(val)) return;

    const newOtp = [...otp];

    // Handle single digit input
    if (val.length === 1) {
      newOtp[index] = val;
      setOtp(newOtp);

      // Move to next input
      if (index < length - 1 && val) {
        inputRefs.current[index + 1].focus();
      }

      // Check if OTP is complete
      const otpString = newOtp.join('');
      onChange(otpString);
      
      if (otpString.length === length && onComplete) {
        onComplete(otpString);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      }
    }

    // Move to next input on arrow right
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1].focus();
    }

    // Move to previous input on arrow left
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    
    if (pasteData) {
      const newOtp = pasteData.slice(0, length).split('');
      while (newOtp.length < length) {
        newOtp.push('');
      }
      setOtp(newOtp);
      
      const otpString = newOtp.join('');
      onChange(otpString);

      // Focus last filled input or last input
      const lastFilledIndex = Math.min(pasteData.length - 1, length - 1);
      inputRefs.current[lastFilledIndex].focus();

      // Check if OTP is complete
      if (otpString.length === length && onComplete) {
        onComplete(otpString);
      }
    }
  };

  const handleFocus = (index) => {
    // Select all text on focus
    inputRefs.current[index].select();
  };

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.inputContainer,
        ...(error ? styles.inputContainerError : {}),
        ...(success ? styles.inputContainerSuccess : {})
      }}>
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(ref) => (inputRefs.current[index] = ref)}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => handleFocus(index)}
            style={{
              ...styles.input,
              ...(digit ? styles.inputFilled : {}),
              ...(error ? styles.inputError : {}),
              ...(success ? styles.inputSuccess : {})
            }}
          />
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.3s'
  },
  inputContainerError: {
    animation: 'shake 0.5s'
  },
  inputContainerSuccess: {
    animation: 'pulse 0.5s'
  },
  input: {
    width: '45px',
    height: '55px',
    fontSize: '24px',
    fontWeight: 'bold',
    textAlign: 'center',
    border: '2px solid rgba(120, 119, 198, 0.3)',
    borderRadius: '8px',
    backgroundColor: '#16213e',
    color: '#fff',
    outline: 'none',
    transition: 'all 0.3s',
    caretColor: '#7877c6'
  },
  inputFilled: {
    borderColor: '#7877c6',
    backgroundColor: '#1a1a2e',
    boxShadow: '0 0 10px rgba(120, 119, 198, 0.3)'
  },
  inputError: {
    borderColor: '#ff6b6b',
    backgroundColor: 'rgba(255, 107, 107, 0.1)'
  },
  inputSuccess: {
    borderColor: '#4ecdc4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    boxShadow: '0 0 10px rgba(78, 205, 196, 0.3)'
  }
};

// Add CSS animations
const styleSheet = document.styleSheets[0];
if (styleSheet) {
  try {
    styleSheet.insertRule(`
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
      }
    `, styleSheet.cssRules.length);

    styleSheet.insertRule(`
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
    `, styleSheet.cssRules.length);
  } catch (e) {
    // Animations already exist
  }
}

export default OTPInput;