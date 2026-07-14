import { clientsClaim } from "workbox-core";
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// 새 SW 즉시 활성화 + 오래된 캐시 정리 + 오프라인 프리캐시(vite-plugin-pwa 주입).
self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

// FCM 백그라운드 수신 — Firebase 설정이 있을 때만.
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
if (apiKey) {
  const app = initializeApp({
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  const messaging = getMessaging(app);

  // data-only 페이로드만 처리 → SW가 딱 한 번 표시(중복 방지). notification 필드는 쓰지 않음.
  onBackgroundMessage(messaging, (payload) => {
    const { title, body, id, playerId } = payload.data ?? {};
    self.registration.showNotification(title || "트윈스 코인", {
      body: body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      vibrate: [200, 100, 200],
      tag: id || `coin-${Date.now()}`, // 고유 tag로 덮어쓰기 방지
      data: { playerId: playerId || "" },
    });
  });
}

// 알림 클릭 → 해당 선수 화면으로.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const pid = event.notification.data?.playerId;
  const url = pid ? `/players?id=${pid}` : "/";
  event.waitUntil(
    (async () => {
      const list = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of list) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) {
            try {
              await client.navigate(url);
            } catch {
              // 내비게이션 실패 무시
            }
          }
          return;
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })()
  );
});
