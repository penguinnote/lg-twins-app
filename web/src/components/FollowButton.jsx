import { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { enablePush, setFollow, watchSubscriber, isIOS, isStandalone } from "../lib/notify";

// 팔로우(별) 토글. 처음 켤 때 알림 권한·토큰 등록 유도. Firebase 미설정 시 렌더 안 함.
export function FollowButton({ playerId, size = "md" }) {
  const { uid, ready } = useAuth();
  const [followed, setFollowed] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    if (!uid) return;
    return watchSubscriber(uid, ({ followedPlayers, hasToken }) => {
      setFollowed(followedPlayers.includes(playerId));
      setHasToken(hasToken);
    });
  }, [uid, playerId]);

  if (!ready) return null; // Firebase 미설정 → 알림 기능 숨김

  const onClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!uid) return;
    const turningOn = !followed;
    setFollowed(turningOn); // 낙관적 갱신

    if (turningOn) {
      if (isIOS() && !isStandalone()) {
        // iOS는 설치 후에만 웹푸시 가능 → 팔로우는 저장하되 안내
        setHint("iOS는 홈 화면에 추가(설치) 후 알림을 받을 수 있어요.");
      } else if (!hasToken || Notification.permission !== "granted") {
        const res = await enablePush(uid);
        if (!res.ok && res.reason === "denied") {
          setHint("브라우저 알림이 차단돼 있어요. 사이트 설정에서 허용해 주세요.");
        }
      }
    }
    try {
      await setFollow(uid, playerId, turningOn);
    } catch {
      setFollowed(!turningOn); // 실패 롤백
    }
  };

  const px = size === "sm" ? "h-8 w-8" : "px-3 py-1.5";
  return (
    <div className="relative">
      <button
        onClick={onClick}
        aria-pressed={followed}
        title={followed ? "팔로우 중 · 알림 받기" : "팔로우 + 알림 받기"}
        className={`inline-flex items-center gap-1 rounded-full border text-sm font-semibold transition-colors ${px} ${
          followed
            ? "border-lg-red bg-lg-red text-white"
            : "border-gray-300 bg-white text-gray-500 hover:border-lg-red hover:text-lg-red"
        }`}
      >
        <Star filled={followed} />
        {size !== "sm" && <span>{followed ? "팔로우 중" : "팔로우"}</span>}
      </button>
      {hint && (
        <p className="absolute right-0 z-10 mt-1 w-56 rounded-lg border border-gray-100 bg-white p-2 text-[11px] leading-snug text-gray-500 shadow-lg">
          {hint}
        </p>
      )}
    </div>
  );
}

function Star({ filled }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
      <path d="M12 3.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L12 17l-5.3 2.8 1-5.8L3.5 9.7l5.9-.9L12 3.5z" strokeLinejoin="round" />
    </svg>
  );
}
