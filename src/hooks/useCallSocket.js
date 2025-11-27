// useCallSocket Hook - Handles all call-related socket events
import { useEffect, useRef } from 'react';
import { getSocket } from '../services/socket';

export const useCallSocket = (callbacks) => {
  const {
    onIncomingCall,
    onCallAccepted,
    onCallDeclined,
    onWebRTCOffer,
    onWebRTCAnswer,
    onIceCandidate,
    onCallEnded,
    onError
  } = callbacks;

  // Store callbacks in refs to avoid re-registering listeners
  const callbacksRef = useRef(callbacks);
  const socketRef = useRef(null);
  const listenersRegistered = useRef(false); // ✅ NEW: Track registration status
  const retryCount = useRef(0); // ✅ NEW: Track retry attempts

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    // ✅ NEW: Function to register listeners with retry logic
    const registerListeners = () => {
      const socket = getSocket();

      // Check if socket is connected
      if (!socket || !socket.connected) {
        retryCount.current += 1;
        
        if (retryCount.current <= 10) { // Max 10 retries (5 seconds)
          console.warn(`⚠️ Socket not connected yet, retry ${retryCount.current}/10 in 500ms...`);
          setTimeout(registerListeners, 500);
        } else {
          console.error('❌ Failed to connect socket after 10 retries');
        }
        return;
      }

      // Check if listeners already registered
      if (listenersRegistered.current) {
        console.log('✅ Call listeners already registered');
        return;
      }

      socketRef.current = socket;
      console.log('📞 Registering call socket listeners...');

      // ============================================
      // INCOMING CALL
      // ============================================
      const handleIncomingCall = (data) => {
        console.log('📞 Incoming call from:', data.callerGhostName);
        if (callbacksRef.current.onIncomingCall) {
          callbacksRef.current.onIncomingCall(data);
        }
      };

      // ============================================
      // CALL ACCEPTED
      // ============================================
      const handleCallAccepted = (data) => {
        console.log('✅ Call accepted by:', data.receiverGhostName);
        if (callbacksRef.current.onCallAccepted) {
          callbacksRef.current.onCallAccepted(data);
        }
      };

      // ============================================
      // CALL DECLINED
      // ============================================
      const handleCallDeclined = (data) => {
        console.log('❌ Call declined by:', data.receiverGhostName);
        if (callbacksRef.current.onCallDeclined) {
          callbacksRef.current.onCallDeclined(data);
        }
      };

      // ============================================
      // WEBRTC OFFER (Receiver gets this)
      // ============================================
      const handleWebRTCOffer = (data) => {
        console.log('📥 Received WebRTC offer');
        if (callbacksRef.current.onWebRTCOffer) {
          callbacksRef.current.onWebRTCOffer(data);
        }
      };

      // ============================================
      // WEBRTC ANSWER (Caller gets this)
      // ============================================
      const handleWebRTCAnswer = (data) => {
        console.log('📥 Received WebRTC answer');
        if (callbacksRef.current.onWebRTCAnswer) {
          callbacksRef.current.onWebRTCAnswer(data);
        }
      };

      // ============================================
      // ICE CANDIDATE (Both parties exchange these)
      // ============================================
      const handleIceCandidate = (data) => {
        console.log('🧊 Received ICE candidate');
        if (callbacksRef.current.onIceCandidate) {
          callbacksRef.current.onIceCandidate(data);
        }
      };

      // ============================================
      // CALL ENDED
      // ============================================
      const handleCallEnded = (data) => {
        console.log('📴 Call ended by:', data.endedBy);
        if (callbacksRef.current.onCallEnded) {
          callbacksRef.current.onCallEnded(data);
        }
      };

      // ============================================
      // ERROR
      // ============================================
      const handleError = (data) => {
        console.error('❌ Call error:', data.error);
        if (callbacksRef.current.onError) {
          callbacksRef.current.onError(data);
        }
      };

      // Register all listeners
      socket.on('incoming-call', handleIncomingCall);
      socket.on('call-accepted', handleCallAccepted);
      socket.on('call-declined', handleCallDeclined);
      socket.on('webrtc-offer', handleWebRTCOffer);
      socket.on('webrtc-answer', handleWebRTCAnswer);
      socket.on('ice-candidate', handleIceCandidate);
      socket.on('call-ended', handleCallEnded);
      socket.on('call-error', handleError);

      listenersRegistered.current = true; // ✅ NEW: Mark as registered
      console.log('✅ Call socket listeners registered successfully');
    };

    // ✅ NEW: Start registration process
    registerListeners();

    // Cleanup function - remove all listeners
    return () => {
      const socket = socketRef.current;
      if (socket && listenersRegistered.current) {
        console.log('🧹 Cleaning up call socket listeners');
        socket.off('incoming-call');
        socket.off('call-accepted');
        socket.off('call-declined');
        socket.off('webrtc-offer');
        socket.off('webrtc-answer');
        socket.off('ice-candidate');
        socket.off('call-ended');
        socket.off('call-error');
        listenersRegistered.current = false;
        retryCount.current = 0; // ✅ NEW: Reset retry count
      }
    };
  }, []); // Empty dependency array - register once on mount

  // Return socket emitter functions with proper socket reference
  return {
    // Initiate a call
    callUser: (targetGhostName) => {
      const socket = socketRef.current || getSocket();
      if (!socket || !socket.connected) {
        console.error('❌ Socket not connected');
        return;
      }
      console.log('📞 Calling user:', targetGhostName);
      socket.emit('call-user', { targetGhostName });
    },

    // Accept incoming call
    acceptCall: (callId) => {
      const socket = socketRef.current || getSocket();
      if (!socket || !socket.connected) return;
      console.log('✅ Accepting call:', callId);
      socket.emit('call-accepted', { callId });
    },

    // Decline incoming call
    declineCall: (callId) => {
      const socket = socketRef.current || getSocket();
      if (!socket || !socket.connected) return;
      console.log('❌ Declining call:', callId);
      socket.emit('call-declined', { callId });
    },

    // Send WebRTC offer
    sendOffer: (callId, offer) => {
      const socket = socketRef.current || getSocket();
      if (!socket || !socket.connected) return;
      console.log('📤 Sending WebRTC offer');
      socket.emit('webrtc-offer', { callId, offer });
    },

    // Send WebRTC answer
    sendAnswer: (callId, answer) => {
      const socket = socketRef.current || getSocket();
      if (!socket || !socket.connected) return;
      console.log('📤 Sending WebRTC answer');
      socket.emit('webrtc-answer', { callId, answer });
    },

    // Send ICE candidate
    sendIceCandidate: (callId, candidate) => {
      const socket = socketRef.current || getSocket();
      if (!socket || !socket.connected) return;
      console.log('📤 Sending ICE candidate');
      socket.emit('ice-candidate', { callId, candidate });
    },

    // End call
    endCall: (callId) => {
      const socket = socketRef.current || getSocket();
      if (!socket || !socket.connected) return;
      console.log('📴 Ending call:', callId);
      socket.emit('call-ended', { callId });
    }
  };
};