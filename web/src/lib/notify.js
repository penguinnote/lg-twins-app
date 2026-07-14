// 구독·팔로우 — FCM 토큰 등록 + subscribers/{uid} 관리. Convene enablePush 재활용.
import { getToken } from "firebase/messaging";
import {
  doc,
  setDoc,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from "firebase/firestore";
import { db, getMessagingIfSupported } from "../firebase";

export function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
export function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}
function platform() {
  if (isIOS()) return "ios";
  if (/android/i.test(navigator.userAgent)) return "android";
  return "other";
}

/**
 * 알림 권한 요청 + FCM 토큰 등록 → subscribers/{uid}에 저장.
 * @returns {ok, reason}
 */
export async function enablePush(uid) {
  if (!uid || !db) return { ok: false, reason: "not-ready" };
  const messaging = await getMessagingIfSupported();
  if (!messaging) return { ok: false, reason: "unsupported" };

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, reason: permission };

  const swReg = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: swReg,
  });
  if (!token) return { ok: false, reason: "no-token" };

  await setDoc(
    doc(db, "subscribers", uid),
    { token, platform: platform(), updatedAt: serverTimestamp() },
    { merge: true }
  );
  return { ok: true, token };
}

/** 팔로우 토글 → subscribers/{uid}.followedPlayers 갱신. */
export async function setFollow(uid, playerId, on) {
  if (!uid || !db) return;
  await setDoc(
    doc(db, "subscribers", uid),
    {
      followedPlayers: on ? arrayUnion(playerId) : arrayRemove(playerId),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** subscribers/{uid} 실시간 구독 → {followedPlayers, hasToken}. */
export function watchSubscriber(uid, cb) {
  if (!uid || !db) return () => {};
  return onSnapshot(doc(db, "subscribers", uid), (snap) => {
    const d = snap.exists() ? snap.data() : {};
    cb({ followedPlayers: d.followedPlayers || [], hasToken: !!d.token });
  });
}
