// Firebase 초기화 — 설정값(.env)이 없으면 안전하게 비활성(앱은 그대로 동작, 알림만 꺼짐).
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported } from "firebase/messaging";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// 설정이 갖춰졌을 때만 초기화(미설정 시 알림 기능만 비활성).
export const firebaseReady = Boolean(cfg.apiKey && cfg.projectId);

export const app = firebaseReady ? initializeApp(cfg) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

export async function getMessagingIfSupported() {
  if (!app) return null;
  try {
    return (await isSupported()) ? getMessaging(app) : null;
  } catch {
    return null;
  }
}
