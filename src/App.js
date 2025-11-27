import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import GroupChat from './pages/GroupChat';
import GroupDetails from './pages/GroupDetails';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import OTPTest from './pages/OTPTest';

// 📞 NEW: Calling feature imports
import { CallProvider } from './context/CallContext';
import IncomingCallModal from './components/IncomingCallModal';
import ActiveCallScreen from './components/ActiveCallScreen';

function App() {
  return (
    <BrowserRouter>
      {/* 📞 NEW: Wrap entire app with CallProvider for global call state */}
      <CallProvider>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/groups" 
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/create-group" 
            element={
              <ProtectedRoute>
                <CreateGroup />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/group/:groupId" 
            element={
              <ProtectedRoute>
                <GroupChat />
              </ProtectedRoute>
            } 
          />

          {/* Group Details Route */}
          <Route 
            path="/group/:groupId/details" 
            element={
              <ProtectedRoute>
                <GroupDetails />
              </ProtectedRoute>
            } 
          />

          <Route path="/otp-test" element={<OTPTest />} />

          {/* Profile Route */}
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
        </Routes>

        {/* 📞 NEW: Global call modals (shown on top of all pages) */}
        <IncomingCallModal />
        <ActiveCallScreen />
      </CallProvider>
    </BrowserRouter>
  );
}

export default App;