import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDCxpgorz4s0bxjWQfGHLD0FMk3noOUtiw",
  authDomain: "auto-accounting-diyorbek-s.firebaseapp.com",
  projectId: "auto-accounting-diyorbek-s",
  storageBucket: "auto-accounting-diyorbek-s.firebasestorage.app",
  messagingSenderId: "833775518230",
  appId: "1:833775518230:web:68b6afba75f16332c82b37",
  measurementId: "G-X7S9YH3BKW"
};

// Next.js hot-reloading'da xato bermasligi uchun tekshiruv bilan ishga tushiramiz
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Xizmatlarni eksport qilamiz
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };