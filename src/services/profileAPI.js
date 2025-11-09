import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/profile`;

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// ============================================
// GET USER PROFILE
// ============================================
export const getProfile = async () => {
  try {
    const response = await axios.get(API_URL, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error.response?.data || { error: 'Failed to fetch profile' };
  }
};

// ============================================
// UPDATE PROFILE (username, bio)
// ============================================
export const updateProfile = async (profileData) => {
  try {
    const response = await axios.put(`${API_URL}/update`, profileData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error.response?.data || { error: 'Failed to update profile' };
  }
};

// ============================================
// UPLOAD AVATAR
// ============================================
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await axios.post(`${API_URL}/avatar`, formData, {
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error.response?.data || { error: 'Failed to upload avatar' };
  }
};