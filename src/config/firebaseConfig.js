// src/config/firebaseConfig.js

// src/config/firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyD3osYCcuheMvw2UfqcC2m4Dpl1UYbLxW4",
  authDomain: "ghost-ff8a0.firebaseapp.com",
  projectId: "ghost-ff8a0",
  storageBucket: "ghost-ff8a0.firebasestorage.app",
  messagingSenderId: "973869887556",
  appId: "1:973869887556:web:8d8890db9cc379f61dcc11"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

export default app;