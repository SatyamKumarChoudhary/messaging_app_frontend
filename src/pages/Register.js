import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
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

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/auth/register', {
        username: formData.username || null,
        email: formData.email || null,
        phone: formData.phone,
        password: formData.password
      });
      
      // Store token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // Show success message if pending messages were delivered
      if (response.data.pendingMessagesDelivered > 0) {
        alert(`Welcome! You have ${response.data.pendingMessagesDelivered} pending message(s) waiting for you!`);
      }
      
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
        <h1 style={styles.title}>📨 Snap - Register</h1>
        
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Phone Number <span style={styles.required}>*</span>
            </label>
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
              Your primary identifier - Format: +91 followed by 10 digits
            </small>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Username (Optional)</label>
            <input
              type="text"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              style={styles.input}
            />
            <small style={styles.hint}>
              Display name (optional, defaults to phone number)
            </small>
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email (Optional)</label>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              style={styles.input}
            />
          </div>
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Password <span style={styles.required}>*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="At least 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              style={styles.input}
            />
          </div>
          
          {error && <p style={styles.error}>{error}</p>}
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <p style={styles.link}>
          Already have an account? <a href="/login">Login here</a>
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
    backgroundColor: '#f0f2f5',
    fontFamily: 'Arial, sans-serif'
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '30px',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#555'
  },
  required: {
    color: 'red'
  },
  input: {
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    outline: 'none'
  },
  hint: {
    fontSize: '12px',
    color: '#888',
    marginTop: '2px'
  },
  button: {
    padding: '12px',
    fontSize: '16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginTop: '10px'
  },
  error: {
    color: 'red',
    fontSize: '14px',
    textAlign: 'center',
    margin: '10px 0'
  },
  link: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px'
  }
};

export default Register;