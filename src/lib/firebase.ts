import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ─── REPLACE THESE WITH YOUR OWN FIREBASE PROJECT CONFIG ───
// Go to: https://console.firebase.google.com → Project Settings → General → Your apps → Web app
const firebaseConfig = {
  apiKey: "AIzaSyDhlm-oPX0-vo9BlipO1vRXtx0JULZkP5g",
  authDomain: "guardianbox-eb0d5.firebaseapp.com",
  projectId: "guardianbox-eb0d5",
  storageBucket: "guardianbox-eb0d5.firebasestorage.app",
  messagingSenderId: "1036827576055",
  appId: "1:1036827576055:web:e760b39689671fff28f5f2",
  measurementId: "G-D3E9MGHH3Z"
};

export const auth = getAuth(app);
