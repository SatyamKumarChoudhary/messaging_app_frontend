import React, { useState, useRef, useEffect } from 'react';

const POPULAR_COUNTRIES = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' }
];

const ALL_COUNTRIES = [
  { code: '+93', name: 'Afghanistan', flag: '🇦🇫' },
  { code: '+355', name: 'Albania', flag: '🇦🇱' },
  { code: '+213', name: 'Algeria', flag: '🇩🇿' },
  { code: '+376', name: 'Andorra', flag: '🇦🇩' },
  { code: '+244', name: 'Angola', flag: '🇦🇴' },
  { code: '+54', name: 'Argentina', flag: '🇦🇷' },
  { code: '+374', name: 'Armenia', flag: '🇦🇲' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+43', name: 'Austria', flag: '🇦🇹' },
  { code: '+994', name: 'Azerbaijan', flag: '🇦🇿' },
  { code: '+973', name: 'Bahrain', flag: '🇧🇭' },
  { code: '+880', name: 'Bangladesh', flag: '🇧🇩' },
  { code: '+375', name: 'Belarus', flag: '🇧🇾' },
  { code: '+32', name: 'Belgium', flag: '🇧🇪' },
  { code: '+501', name: 'Belize', flag: '🇧🇿' },
  { code: '+229', name: 'Benin', flag: '🇧🇯' },
  { code: '+975', name: 'Bhutan', flag: '🇧🇹' },
  { code: '+591', name: 'Bolivia', flag: '🇧🇴' },
  { code: '+387', name: 'Bosnia', flag: '🇧🇦' },
  { code: '+267', name: 'Botswana', flag: '🇧🇼' },
  { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  { code: '+673', name: 'Brunei', flag: '🇧🇳' },
  { code: '+359', name: 'Bulgaria', flag: '🇧🇬' },
  { code: '+226', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: '+257', name: 'Burundi', flag: '🇧🇮' },
  { code: '+855', name: 'Cambodia', flag: '🇰🇭' },
  { code: '+237', name: 'Cameroon', flag: '🇨🇲' },
  { code: '+1', name: 'Canada', flag: '🇨🇦' },
  { code: '+56', name: 'Chile', flag: '🇨🇱' },
  { code: '+86', name: 'China', flag: '🇨🇳' },
  { code: '+57', name: 'Colombia', flag: '🇨🇴' },
  { code: '+506', name: 'Costa Rica', flag: '🇨🇷' },
  { code: '+385', name: 'Croatia', flag: '🇭🇷' },
  { code: '+53', name: 'Cuba', flag: '🇨🇺' },
  { code: '+357', name: 'Cyprus', flag: '🇨🇾' },
  { code: '+420', name: 'Czech Republic', flag: '🇨🇿' },
  { code: '+45', name: 'Denmark', flag: '🇩🇰' },
  { code: '+20', name: 'Egypt', flag: '🇪🇬' },
  { code: '+372', name: 'Estonia', flag: '🇪🇪' },
  { code: '+251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '+358', name: 'Finland', flag: '🇫🇮' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+995', name: 'Georgia', flag: '🇬🇪' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+233', name: 'Ghana', flag: '🇬🇭' },
  { code: '+30', name: 'Greece', flag: '🇬🇷' },
  { code: '+502', name: 'Guatemala', flag: '🇬🇹' },
  { code: '+509', name: 'Haiti', flag: '🇭🇹' },
  { code: '+504', name: 'Honduras', flag: '🇭🇳' },
  { code: '+852', name: 'Hong Kong', flag: '🇭🇰' },
  { code: '+36', name: 'Hungary', flag: '🇭🇺' },
  { code: '+354', name: 'Iceland', flag: '🇮🇸' },
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+62', name: 'Indonesia', flag: '🇮🇩' },
  { code: '+98', name: 'Iran', flag: '🇮🇷' },
  { code: '+964', name: 'Iraq', flag: '🇮🇶' },
  { code: '+353', name: 'Ireland', flag: '🇮🇪' },
  { code: '+972', name: 'Israel', flag: '🇮🇱' },
  { code: '+39', name: 'Italy', flag: '🇮🇹' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
  { code: '+962', name: 'Jordan', flag: '🇯🇴' },
  { code: '+7', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  { code: '+965', name: 'Kuwait', flag: '🇰🇼' },
  { code: '+371', name: 'Latvia', flag: '🇱🇻' },
  { code: '+961', name: 'Lebanon', flag: '🇱🇧' },
  { code: '+218', name: 'Libya', flag: '🇱🇾' },
  { code: '+370', name: 'Lithuania', flag: '🇱🇹' },
  { code: '+352', name: 'Luxembourg', flag: '🇱🇺' },
  { code: '+60', name: 'Malaysia', flag: '🇲🇾' },
  { code: '+960', name: 'Maldives', flag: '🇲🇻' },
  { code: '+52', name: 'Mexico', flag: '🇲🇽' },
  { code: '+212', name: 'Morocco', flag: '🇲🇦' },
  { code: '+977', name: 'Nepal', flag: '🇳🇵' },
  { code: '+31', name: 'Netherlands', flag: '🇳🇱' },
  { code: '+64', name: 'New Zealand', flag: '🇳🇿' },
  { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '+47', name: 'Norway', flag: '🇳🇴' },
  { code: '+968', name: 'Oman', flag: '🇴🇲' },
  { code: '+92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '+507', name: 'Panama', flag: '🇵🇦' },
  { code: '+51', name: 'Peru', flag: '🇵🇪' },
  { code: '+63', name: 'Philippines', flag: '🇵🇭' },
  { code: '+48', name: 'Poland', flag: '🇵🇱' },
  { code: '+351', name: 'Portugal', flag: '🇵🇹' },
  { code: '+974', name: 'Qatar', flag: '🇶🇦' },
  { code: '+40', name: 'Romania', flag: '🇷🇴' },
  { code: '+7', name: 'Russia', flag: '🇷🇺' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+27', name: 'South Africa', flag: '🇿🇦' },
  { code: '+82', name: 'South Korea', flag: '🇰🇷' },
  { code: '+34', name: 'Spain', flag: '🇪🇸' },
  { code: '+94', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+46', name: 'Sweden', flag: '🇸🇪' },
  { code: '+41', name: 'Switzerland', flag: '🇨🇭' },
  { code: '+886', name: 'Taiwan', flag: '🇹🇼' },
  { code: '+66', name: 'Thailand', flag: '🇹🇭' },
  { code: '+90', name: 'Turkey', flag: '🇹🇷' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+380', name: 'Ukraine', flag: '🇺🇦' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', name: 'United States', flag: '🇺🇸' },
  { code: '+598', name: 'Uruguay', flag: '🇺🇾' },
  { code: '+58', name: 'Venezuela', flag: '🇻🇪' },
  { code: '+84', name: 'Vietnam', flag: '🇻🇳' },
  { code: '+967', name: 'Yemen', flag: '🇾🇪' },
  { code: '+260', name: 'Zambia', flag: '🇿🇲' },
  { code: '+263', name: 'Zimbabwe', flag: '🇿🇼' }
];

function CountryCodeDropdown({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  // Default to India if no value
  const selectedCountry = value || POPULAR_COUNTRIES[0];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = ALL_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code.includes(searchTerm)
  );

  const handleSelect = (country) => {
    onChange(country);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div style={styles.container} ref={dropdownRef}>
      {/* Selected Country Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={styles.button}
      >
        <span style={styles.buttonContent}>
          <span style={styles.flag}>{selectedCountry.flag}</span>
          <span style={styles.countryName}>{selectedCountry.name}</span>
          <span style={styles.code}>({selectedCountry.code})</span>
        </span>
        <span style={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={styles.dropdown}>
          {/* Search Input */}
          <div style={styles.searchContainer}>
            <input
              type="text"
              placeholder="🔍 Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
              autoFocus
            />
          </div>

          {/* Popular Countries (only show if no search) */}
          {!searchTerm && (
            <>
              <div style={styles.sectionHeader}>⭐ Popular</div>
              {POPULAR_COUNTRIES.map((country, index) => (
                <div
                  key={`popular-${index}`}
                  onClick={() => handleSelect(country)}
                  style={{
                    ...styles.countryItem,
                    ...(selectedCountry.code === country.code ? styles.countryItemSelected : {})
                  }}
                >
                  <span style={styles.flag}>{country.flag}</span>
                  <span style={styles.countryText}>{country.name}</span>
                  <span style={styles.codeText}>{country.code}</span>
                </div>
              ))}
              <div style={styles.divider}></div>
              <div style={styles.sectionHeader}>📋 All Countries</div>
            </>
          )}

          {/* All Countries List */}
          <div style={styles.countryList}>
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country, index) => (
                <div
                  key={index}
                  onClick={() => handleSelect(country)}
                  style={{
                    ...styles.countryItem,
                    ...(selectedCountry.code === country.code ? styles.countryItemSelected : {})
                  }}
                >
                  <span style={styles.flag}>{country.flag}</span>
                  <span style={styles.countryText}>{country.name}</span>
                  <span style={styles.codeText}>{country.code}</span>
                </div>
              ))
            ) : (
              <div style={styles.noResults}>No countries found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    width: '100%'
  },
  button: {
    width: '100%',
    padding: '12px 14px',
    fontSize: '15px',
    border: '1px solid rgba(120, 119, 198, 0.3)',
    borderRadius: '8px',
    backgroundColor: '#16213e',
    color: '#fff',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.3s',
    outline: 'none'
  },
  buttonContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  flag: {
    fontSize: '20px'
  },
  countryName: {
    fontWeight: '500'
  },
  code: {
    color: '#a0a0c0',
    fontSize: '14px'
  },
  arrow: {
    color: '#7877c6',
    fontSize: '12px',
    transition: 'transform 0.3s'
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '8px',
    backgroundColor: '#1a1a2e',
    border: '1px solid rgba(120, 119, 198, 0.3)',
    borderRadius: '8px',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
    maxHeight: '400px',
    overflow: 'hidden',
    zIndex: 1000,
    animation: 'slideDown 0.3s ease'
  },
  searchContainer: {
    padding: '12px',
    borderBottom: '1px solid rgba(120, 119, 198, 0.2)'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid rgba(120, 119, 198, 0.3)',
    borderRadius: '6px',
    backgroundColor: '#16213e',
    color: '#fff',
    outline: 'none'
  },
  sectionHeader: {
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#7877c6',
    backgroundColor: 'rgba(120, 119, 198, 0.1)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  countryList: {
    maxHeight: '280px',
    overflowY: 'auto'
  },
  countryItem: {
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid rgba(120, 119, 198, 0.1)'
  },
  countryItemSelected: {
    backgroundColor: 'rgba(120, 119, 198, 0.2)',
    borderLeft: '3px solid #7877c6'
  },
  countryText: {
    flex: 1,
    fontSize: '14px'
  },
  codeText: {
    fontSize: '13px',
    color: '#a0a0c0'
  },
  divider: {
    height: '1px',
    backgroundColor: 'rgba(120, 119, 198, 0.2)',
    margin: '8px 0'
  },
  noResults: {
    padding: '20px',
    textAlign: 'center',
    color: '#a0a0c0',
    fontSize: '14px'
  }
};

export default CountryCodeDropdown;