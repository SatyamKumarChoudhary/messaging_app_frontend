import io from 'socket.io-client';

let socket = null;

// Connect to Socket.io server with JWT token
export const connectSocket = (token) => {
  if (socket) return socket;
  
  // Connect to backend server
  socket = io('http://localhost:3001', {
    auth: { token }
  });
  
  // Connection event handlers
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });
  
  return socket;
};

// Disconnect from Socket.io server
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected manually');
  }
};

// Get current socket instance
export const getSocket = () => socket;