// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration with resilient fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCLOlDRIYzXyhkjQ4AfmyApHlTFBVGQ5SM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "sos-street.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "sos-street",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "sos-street.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "166698346533",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:166698346533:web:06cc4059099bcae7c1f7cc",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-N2Q5VKTT9Z"
};

// Initialize Firebase safely
let app;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch (err) {
  console.warn("Firebase initializeApp error, falling back:", err);
  app = initializeApp(firebaseConfig, "STREET_SENTINEL_APP");
}

let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("Analytics initialization warning:", e);
      }
    }
  }).catch(() => {});
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export { analytics };
export default app;
