// WebRTC Service - Handles peer connection, offers, answers, ICE candidates
import { rtcConfig } from '../config/turnServers';

class WebRTCService {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.onRemoteStream = null;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
  }

  // Initialize peer connection
  async initialize() {
    try {
      // Create new RTCPeerConnection
      this.peerConnection = new RTCPeerConnection(rtcConfig);

      // Create remote stream
      this.remoteStream = new MediaStream();

      // Handle incoming remote tracks
      this.peerConnection.ontrack = (event) => {
        console.log('📡 Received remote track:', event.track.kind);
        event.streams[0].getTracks().forEach(track => {
          this.remoteStream.addTrack(track);
        });
        
        // Notify caller about remote stream
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 New ICE candidate generated');
          if (this.onIceCandidate) {
            this.onIceCandidate(event.candidate);
          }
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        console.log('🔗 Connection state:', this.peerConnection.connectionState);
        if (this.onConnectionStateChange) {
          this.onConnectionStateChange(this.peerConnection.connectionState);
        }
      };

      console.log('✅ WebRTC peer connection initialized');
      return true;

    } catch (error) {
      console.error('❌ Error initializing peer connection:', error);
      throw error;
    }
  }

  // Get user's microphone stream
  async getUserMedia() {
    try {
      console.log('🎤 Requesting microphone access...');
      
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false // Voice only for now
      });

      console.log('✅ Microphone access granted');

      // Add local stream tracks to peer connection
      if (this.peerConnection) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection.addTrack(track, this.localStream);
          console.log('📤 Added local track to peer connection:', track.kind);
        });
      }

      return this.localStream;

    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      throw new Error('Microphone access denied. Please allow microphone permissions.');
    }
  }

  // Create WebRTC offer (caller side)
  async createOffer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      console.log('📝 Creating WebRTC offer...');
      
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Local description set (offer)');

      return offer;

    } catch (error) {
      console.error('❌ Error creating offer:', error);
      throw error;
    }
  }

  // Create WebRTC answer (receiver side)
  async createAnswer(offer) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      console.log('📝 Creating WebRTC answer...');

      // Set remote description (offer from caller)
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description set (offer)');

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Local description set (answer)');

      return answer;

    } catch (error) {
      console.error('❌ Error creating answer:', error);
      throw error;
    }
  }

  // Handle received answer (caller side)
  async handleAnswer(answer) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      console.log('📥 Handling WebRTC answer...');
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Remote description set (answer)');

    } catch (error) {
      console.error('❌ Error handling answer:', error);
      throw error;
    }
  }

  // Add ICE candidate
  async addIceCandidate(candidate) {
    try {
      if (!this.peerConnection) {
        console.warn('⚠️ Peer connection not ready, ignoring ICE candidate');
        return;
      }

      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added');

    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
      // Don't throw - ICE candidates can fail without breaking the call
    }
  }

  // Close connection and cleanup
  close() {
    console.log('🔌 Closing WebRTC connection...');

    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped local track:', track.kind);
      });
      this.localStream = null;
    }

    // Stop remote stream tracks
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => {
        track.stop();
      });
      this.remoteStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
      console.log('✅ Peer connection closed');
    }

    // Clear callbacks
    this.onRemoteStream = null;
    this.onIceCandidate = null;
    this.onConnectionStateChange = null;
  }

  // Get connection stats (for debugging)
  async getStats() {
    if (!this.peerConnection) return null;

    const stats = await this.peerConnection.getStats();
    return stats;
  }
}

// Export singleton instance
export default new WebRTCService();