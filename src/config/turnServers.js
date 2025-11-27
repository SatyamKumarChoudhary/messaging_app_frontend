// TURN/STUN Server Configuration for WebRTC
// FREE TURN Server: metered.ca (50GB/month free)

export const iceServers = [
  // Google's public STUN servers (FREE - discovers public IP)
  {
    urls: 'stun:stun.l.google.com:19302'
  },
  {
    urls: 'stun:stun1.l.google.com:19302'
  },
  
  // Metered.ca TURN servers (FREE 50GB/month)
  // Sign up at: https://www.metered.ca/tools/openrelay/
  {
    urls: 'turn:openrelay.metered.ca:80',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  },
  {
    urls: 'turn:openrelay.metered.ca:443?transport=tcp',
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

// WebRTC Configuration
export const rtcConfig = {
  iceServers: iceServers,
  iceCandidatePoolSize: 10
};