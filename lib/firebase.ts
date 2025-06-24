// lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdo5EhKdwoiw7cyjzIDnMXEVvzgNDFVdY",
  authDomain: "chalet-booking-75258.firebaseapp.com",
  projectId: "chalet-booking-75258",
  storageBucket: "chalet-booking-75258.appspot.com",
  messagingSenderId: "644187367457",
  appId: "1:644187367457:web:xxxxx" // ضع الـ appId الصحيح
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
