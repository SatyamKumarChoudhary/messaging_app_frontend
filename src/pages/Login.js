import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Phone input formatter (auto-adds +91 prefix)
  const handlePhoneChange = (e) => {
    let value = e.target.value;
    
    // Remove all non-digit characters
    value = value.replace(/\D/g, '');
    
    // Auto-add +91 prefix if user starts typing
    if (value.length > 0 && !value.startsWith('91')) {
      value = '91' + value;
    }
    
    // Limit to 12 digits (91 + 10 digits)
    if (value.length > 12) {
      value = value.slice(0, 12);
    }
    
    // Add + prefix for display
    const formattedValue = value.length > 0 ? '+' + value : '';
    
    setFormData({
      ...formData,
      phone: formattedValue
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate phone format
    const phoneRegex = /^\+91[6-9]\d{9}$/;
    if (!phoneRegex.test(formData.phone)) {
      setError('Invalid phone number. Must be 10 digits starting with 6-9');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        phone: formData.phone,
        password: formData.password
      });
      
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

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>👻 Snap</h1>
          <p style={styles.subtitle}>Enter as your ghost identity</p>
        </div>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>📱 Phone Number</label>
            <input
              type="tel"
              name="phone"
              placeholder="+919876543210"
              value={formData.phone}
              onChange={handlePhoneChange}
              required
              style={styles.input}
              maxLength="13"
            />
            <small style={styles.hint}>
              Format: +91 followed by 10 digits
            </small>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>🔒 Password</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>
          
          {error && <p style={styles.error}>{error}</p>}
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Entering...' : '👻 Enter as Ghost'}
          </button>
        </form>
        
        <p style={styles.link}>
          Don't have an account? <a href="/register" style={styles.linkText}>Create Ghost Identity</a>
        </p>
      </div>
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
    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.1), transparent 50%), radial-gradient(circle at 80% 80%, rgba(120, 119, 198, 0.1), transparent 50%)'
  },
  card: {
    backgroundColor: '#1a1a2e',
    padding: '40px',
    borderRadius: '15px',
    boxShadow: '0 8px 32px rgba(120, 119, 198, 0.2)',
    width: '100%',
    maxWidth: '400px',
    border: '1px solid rgba(120, 119, 198, 0.2)'
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
    fontSize: '14px'
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
    color: '#fff',
    transition: 'border-color 0.3s'
  },
  hint: {
    fontSize: '12px',
    color: '#a0a0c0',
    marginTop: '2px'
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
    transition: 'background-color 0.3s'
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

export default Login;