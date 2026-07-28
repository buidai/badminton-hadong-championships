// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // THÊM DÒNG NÀY

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDbprxt7KIjH48NNOgEQQpjrTlFzqOiSO4",
  authDomain: "badminton-hadong-championships.firebaseapp.com",
  projectId: "badminton-hadong-championships",
  storageBucket: "badminton-hadong-championships.firebasestorage.app",
  messagingSenderId: "342825512572",
  appId: "1:342825512572:web:9769725024b338e4d523f9",
  measurementId: "G-9FMRQ4NK0C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// THÊM 2 DÒNG NÀY ĐỂ KÍCH HOẠT DATABASE
export const db = getFirestore(app); 
export default app;