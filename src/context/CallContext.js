// CallContext.js - Global state management for calling feature
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useCallSocket } from '../hooks/useCallSocket';
import { useWebRTC } from '../hooks/useWebRTC';

const CallContext = createContext();

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within CallProvider');
  }
  return context;
};

export const CallProvider = ({ children }) => {
  // ============================================
  // STATE
  // ============================================
  const [callState, setCallState] = useState('idle'); // idle, calling, ringing, active, ended
  const [currentCall, setCurrentCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [error, setError] = useState(null);

  const isCleaningUp = useRef(false); // ✅ NEW: Prevent double cleanup

  // ============================================
  // CALL SOCKET EMITTERS (Initialize first)
  // ============================================
  const callSocketEmitters = useCallSocket({
    onIncomingCall: handleIncomingCall,
    onCallAccepted: handleCallAccepted,
    onCallDeclined: handleCallDeclined,
    onWebRTCOffer: handleWebRTCOffer,
    onWebRTCAnswer: handleWebRTCAnswer,
    onIceCandidate: handleIceCandidate,
    onCallEnded: handleCallEnded,
    onError: handleError
  });

  // ============================================
  // WEBRTC HOOK (Needs socket emitters)
  // ============================================
  const webrtc = useWebRTC(callSocketEmitters);

  // ============================================
  // INITIATE CALL
  // ============================================
  const initiateCall = useCallback(async (targetGhostName) => {
    try {
      console.log('📞 Initiating call to:', targetGhostName);
      setCallState('calling');
      setError(null);
      isCleaningUp.current = false; // ✅ NEW: Reset cleanup flag

      // Send call-user event to server
      callSocketEmitters.callUser(targetGhostName);

      // Store call info
      setCurrentCall({
        targetGhostName,
        isOutgoing: true,
        startTime: new Date()
      });

    } catch (err) {
      console.error('❌ Error initiating call:', err);
      setError(err.message || 'Failed to initiate call');
      setCallState('idle');
    }
  }, [callSocketEmitters]);

  // ============================================
  // ACCEPT CALL
  // ============================================
  const acceptCall = useCallback(async () => {
    try {
      if (!incomingCall) {
        throw new Error('No incoming call to accept');
      }

      console.log('✅ Accepting call from:', incomingCall.callerGhostName);
      setCallState('active');
      isCleaningUp.current = false; // ✅ NEW: Reset cleanup flag

      // Initialize WebRTC
      await webrtc.initializeWebRTC(incomingCall.callId);

      // Accept call via socket
      callSocketEmitters.acceptCall(incomingCall.callId);

      // Move to current call
      setCurrentCall({
        callId: incomingCall.callId,
        targetGhostName: incomingCall.callerGhostName,
        isOutgoing: false,
        startTime: new Date()
      });

      setIncomingCall(null);

    } catch (err) {
      console.error('❌ Error accepting call:', err);
      setError(err.message || 'Failed to accept call');
      endCall();
    }
  }, [incomingCall, webrtc, callSocketEmitters]);

  // ============================================
  // DECLINE CALL
  // ============================================
  const declineCall = useCallback(() => {
    if (!incomingCall) return;

    console.log('❌ Declining call from:', incomingCall.callerGhostName);
    callSocketEmitters.declineCall(incomingCall.callId);

    setIncomingCall(null);
    setCallState('idle');
  }, [incomingCall, callSocketEmitters]);

  // ============================================
  // END CALL
  // ============================================
  const endCall = useCallback(() => {
    // ✅ NEW: Prevent double cleanup
    if (isCleaningUp.current) {
      console.log('⚠️ Already ending call, skipping...');
      return;
    }

    isCleaningUp.current = true;
    console.log('📴 Ending call');

    if (currentCall?.callId) {
      callSocketEmitters.endCall(currentCall.callId);
    }

    // Cleanup WebRTC
    webrtc.cleanup();

    setCallState('ended');
    
    // Reset after 2 seconds
    setTimeout(() => {
      setCallState('idle');
      setCurrentCall(null);
      setError(null);
      isCleaningUp.current = false; // ✅ NEW: Reset flag after cleanup
    }, 2000);

  }, [currentCall, callSocketEmitters, webrtc]);

  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================
  function handleIncomingCall(data) {
    console.log('📞 Incoming call received:', data);
    
    setIncomingCall({
      callId: data.callId,
      callerGhostName: data.callerGhostName
    });
    
    setCallState('ringing');
  }

  async function handleCallAccepted(data) {
    console.log('✅ Call accepted:', data);
    
    try {
      setCallState('active');
      isCleaningUp.current = false; // ✅ NEW: Reset cleanup flag

      // Initialize WebRTC
      await webrtc.initializeWebRTC(data.callId);

      // Create and send offer
      await webrtc.createOffer();

      // Update current call with callId
      setCurrentCall(prev => ({
        ...prev,
        callId: data.callId
      }));

    } catch (err) {
      console.error('❌ Error after call accepted:', err);
      setError(err.message || 'Failed to establish connection');
      endCall();
    }
  }

  function handleCallDeclined(data) {
    console.log('❌ Call declined:', data);
    setError('Call was declined');
    setCallState('ended');
    
    setTimeout(() => {
      setCallState('idle');
      setCurrentCall(null);
      setError(null);
    }, 2000);
  }

  async function handleWebRTCOffer(data) {
    console.log('📥 WebRTC offer received');
    
    try {
      // Create answer
      await webrtc.createAnswer(data.offer);

    } catch (err) {
      console.error('❌ Error handling offer:', err);
      setError('Failed to establish connection');
      endCall();
    }
  }

  async function handleWebRTCAnswer(data) {
    console.log('📥 WebRTC answer received');
    
    try {
      // Handle answer
      await webrtc.handleAnswer(data.answer);

    } catch (err) {
      console.error('❌ Error handling answer:', err);
      setError('Failed to establish connection');
      endCall();
    }
  }

  async function handleIceCandidate(data) {
    console.log('🧊 ICE candidate received');
    
    try {
      await webrtc.addIceCandidate(data.candidate);
    } catch (err) {
      console.error('❌ Error adding ICE candidate:', err);
      // Don't end call on ICE candidate errors
    }
  }

  function handleCallEnded(data) {
    console.log('📴 Call ended:', data);
    endCall();
  }

  function handleError(data) {
    console.error('❌ Call error:', data);
    setError(data.error || 'An error occurred');
    endCall();
  }

  // ✅ FIXED: Cleanup ONLY on component unmount
  useEffect(() => {
    return () => {
      console.log('⚠️ CallProvider unmounting - cleaning up');
      webrtc.cleanup();
    };
  }, []); // ← Empty array - cleanup only on unmount

  // ============================================
  // CONTEXT VALUE
  // ============================================
  const value = {
    // State
    callState,
    currentCall,
    incomingCall,
    error,
    
    // WebRTC state
    localStream: webrtc.localStream,
    remoteStream: webrtc.remoteStream,
    connectionState: webrtc.connectionState,
    isMuted: webrtc.isMuted,
    
    // Actions
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute: webrtc.toggleMute
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};