import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    ghost_name: ''  // ← NEW FIELD
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

  // Handle ghost name input (auto-add Ghost_ prefix)
  const handleGhostNameChange = (e) => {
    let value = e.target.value;
    
    // Auto-add "Ghost_" prefix
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
      const response = await axios.post('http://localhost:3001/api/auth/register', formData);
      
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
        <div style={styles.header}>
          <h1 style={styles.title}>👻 Snap - Register</h1>
          <p style={styles.subtitle}>Create your anonymous ghost identity</p>
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
          
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email (Private)</label>
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
            <label style={styles.label}>Phone (Private)</label>
            <input
              type="tel"
              name="phone"
              placeholder="+919876543210"
              value={formData.phone}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* GHOST NAME SECTION */}
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
          
          {error && <p style={styles.error}>{error}</p>}
          
          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? 'Creating Ghost Identity...' : '👻 Create Ghost Account'}
          </button>
        </form>
        
        <p style={styles.link}>
          Already have an account? <a href="/login" style={styles.linkText}>Login here</a>
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
  hint: {
    color: '#ffd700',
    fontSize: '12px',
    margin: 0,
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

export default Register;