import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/groups`;

// Get auth token from localStorage
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

// ============================================
// GET USER'S GROUPS
// ============================================
export const getUserGroups = async () => {
  try {
    const response = await axios.get(`${API_URL}/my-groups`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error.response?.data || { error: 'Failed to fetch groups' };
  }
};

// ============================================
// CREATE GROUP
// ============================================
export const createGroup = async (groupData) => {
  try {
    const response = await axios.post(`${API_URL}/create`, groupData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error creating group:', error);
    throw error.response?.data || { error: 'Failed to create group' };
  }
};

// ============================================
// GET GROUP MESSAGES
// ============================================
export const getGroupMessages = async (groupId, limit = 100) => {
  try {
    const response = await axios.get(`${API_URL}/${groupId}/messages`, {
      headers: getAuthHeader(),
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error.response?.data || { error: 'Failed to fetch messages' };
  }
};

// ============================================
// GET UNREAD MESSAGES
// ============================================
export const getUnreadMessages = async (groupId) => {
  try {
    const response = await axios.get(`${API_URL}/${groupId}/unread-messages`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching unread messages:', error);
    throw error.response?.data || { error: 'Failed to fetch unread messages' };
  }
};

// ============================================
// SEND GROUP MESSAGE
// ============================================
export const sendGroupMessage = async (messageData) => {
  try {
    const response = await axios.post(`${API_URL}/send-message`, messageData, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error.response?.data || { error: 'Failed to send message' };
  }
};

// ============================================
// MARK MESSAGES AS READ
// ============================================
export const markMessagesAsRead = async (groupId, messageId) => {
  try {
    const response = await axios.post(`${API_URL}/mark-read`, 
      { group_id: groupId, message_id: messageId },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error marking as read:', error);
    throw error.response?.data || { error: 'Failed to mark as read' };
  }
};

// ============================================
// GET GROUP DETAILS
// ============================================
export const getGroupDetails = async (groupId) => {
  try {
    const response = await axios.get(`${API_URL}/${groupId}/details`, {
      headers: getAuthHeader()
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching group details:', error);
    throw error.response?.data || { error: 'Failed to fetch group details' };
  }
};

// ============================================
// ADD MEMBER TO GROUP
// ============================================
export const addGroupMember = async (groupId, phone) => {
  try {
    const response = await axios.post(`${API_URL}/add-member`, 
      { group_id: groupId, phone },
      { headers: getAuthHeader() }
    );
    return response.data;
  } catch (error) {
    console.error('Error adding member:', error);
    throw error.response?.data || { error: 'Failed to add member' };
  }
};