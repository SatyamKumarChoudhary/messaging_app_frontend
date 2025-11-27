// useWebRTC Hook - Combines WebRTC service with React state
import { useState, useEffect, useCallback, useRef } from 'react';
import webrtcService from '../services/webrtc';

export const useWebRTC = (callSocketEmitters) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('new');
  const [isMuted, setIsMuted] = useState(false);

  const callIdRef = useRef(null);
  const pendingIceCandidates = useRef([]);
  const isCleaningUp = useRef(false); // ✅ NEW: Prevent double cleanup

  // ============================================
  // INITIALIZE WEBRTC
  // ============================================
  const initializeWebRTC = useCallback(async (callId) => {
    try {
      console.log('🚀 Initializing WebRTC for call:', callId);
      callIdRef.current = callId;
      isCleaningUp.current = false; // ✅ NEW: Reset cleanup flag

      // Initialize peer connection
      await webrtcService.initialize();

      // Set up event handlers
      webrtcService.onRemoteStream = (stream) => {
        console.log('📡 Remote stream received');
        setRemoteStream(stream);
      };

      webrtcService.onIceCandidate = (candidate) => {
        console.log('🧊 ICE candidate generated, sending to peer');
        if (callSocketEmitters?.sendIceCandidate) {
          callSocketEmitters.sendIceCandidate(callId, candidate);
        }
      };

      webrtcService.onConnectionStateChange = (state) => {
        console.log('🔗 Connection state changed:', state);
        setConnectionState(state);
      };

      // Get user's microphone
      const stream = await webrtcService.getUserMedia();
      setLocalStream(stream);

      console.log('✅ WebRTC initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Error initializing WebRTC:', error);
      throw error;
    }
  }, [callSocketEmitters]);

  // ============================================
  // CREATE OFFER (Caller)
  // ============================================
  const createOffer = useCallback(async () => {
    try {
      console.log('📝 Creating WebRTC offer...');
      const offer = await webrtcService.createOffer();

      // Send offer to peer via socket
      if (callSocketEmitters?.sendOffer && callIdRef.current) {
        callSocketEmitters.sendOffer(callIdRef.current, offer);
      }

      return offer;

    } catch (error) {
      console.error('❌ Error creating offer:', error);
      throw error;
    }
  }, [callSocketEmitters]);

  // ============================================
  // CREATE ANSWER (Receiver)
  // ============================================
  const createAnswer = useCallback(async (offer) => {
    try {
      console.log('📝 Creating WebRTC answer...');
      const answer = await webrtcService.createAnswer(offer);

      // Send answer to peer via socket
      if (callSocketEmitters?.sendAnswer && callIdRef.current) {
        callSocketEmitters.sendAnswer(callIdRef.current, answer);
      }

      // Add any pending ICE candidates
      if (pendingIceCandidates.current.length > 0) {
        console.log('🧊 Adding pending ICE candidates:', pendingIceCandidates.current.length);
        for (const candidate of pendingIceCandidates.current) {
          await webrtcService.addIceCandidate(candidate);
        }
        pendingIceCandidates.current = [];
      }

      return answer;

    } catch (error) {
      console.error('❌ Error creating answer:', error);
      throw error;
    }
  }, [callSocketEmitters]);

  // ============================================
  // HANDLE ANSWER (Caller receives answer)
  // ============================================
  const handleAnswer = useCallback(async (answer) => {
    try {
      console.log('📥 Handling WebRTC answer...');
      await webrtcService.handleAnswer(answer);

      // Add any pending ICE candidates
      if (pendingIceCandidates.current.length > 0) {
        console.log('🧊 Adding pending ICE candidates:', pendingIceCandidates.current.length);
        for (const candidate of pendingIceCandidates.current) {
          await webrtcService.addIceCandidate(candidate);
        }
        pendingIceCandidates.current = [];
      }

    } catch (error) {
      console.error('❌ Error handling answer:', error);
      throw error;
    }
  }, []);

  // ============================================
  // ADD ICE CANDIDATE
  // ============================================
  const addIceCandidate = useCallback(async (candidate) => {
    try {
      // If remote description not set yet, queue the candidate
      if (!webrtcService.peerConnection?.remoteDescription) {
        console.log('⏳ Remote description not set, queuing ICE candidate');
        pendingIceCandidates.current.push(candidate);
        return;
      }

      await webrtcService.addIceCandidate(candidate);

    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
      // Don't throw - ICE failures shouldn't break the call
    }
  }, []);

  // ============================================
  // TOGGLE MUTE
  // ============================================
  const toggleMute = useCallback(() => {
    if (!localStream) return;

    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      console.log(audioTrack.enabled ? '🔊 Unmuted' : '🔇 Muted');
    }
  }, [localStream]);

  // ============================================
  // CLEANUP
  // ============================================
  const cleanup = useCallback(() => {
    // ✅ NEW: Prevent double cleanup
    if (isCleaningUp.current) {
      console.log('⚠️ Cleanup already in progress, skipping...');
      return;
    }

    isCleaningUp.current = true;
    console.log('🧹 Cleaning up WebRTC resources');
    
    webrtcService.close();
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionState('closed');
    setIsMuted(false);
    callIdRef.current = null;
    pendingIceCandidates.current = [];

  }, []);

  // ✅ FIXED: Cleanup ONLY on component unmount (not on dependency changes)
  useEffect(() => {
    return () => {
      console.log('⚠️ useWebRTC component unmounting');
      cleanup();
    };
  }, []); // ← Empty array - cleanup only on unmount

  return {
    localStream,
    remoteStream,
    connectionState,
    isMuted,
    initializeWebRTC,
    createOffer,
    createAnswer,
    handleAnswer,
    addIceCandidate,
    toggleMute,
    cleanup
  };
};