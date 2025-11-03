import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Groups from './pages/Groups';
import CreateGroup from './pages/CreateGroup';
import GroupChat from './pages/GroupChat';
import GroupDetails from './pages/GroupDetails';  // NEW IMPORT
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
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

        {/* NEW: Group Details Route */}
        <Route 
          path="/group/:groupId/details" 
          element={
            <ProtectedRoute>
              <GroupDetails />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;