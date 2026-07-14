"""저녁 코인 알림 발송 — Firebase Admin으로 FCM data-only 푸시.

두 종류(NOTIFICATIONS.md):
  (1) 방송: 오늘 |Δ| 최대 선수 1명 → 전체 subscriber
  (2) 개인화: 각 subscriber의 followedPlayers 중 오늘 Δ≠0 → 그 사람
중복 방지: 방송 대상 선수는 개인화에서 제외. data-only 유지(중복 알림 방지), 만료 토큰 정리.

발송 주체: GitHub Actions(서비스계정 키 = 시크릿 FIREBASE_SERVICE_ACCOUNT).
키가 없으면(로컬/포크) 조용히 스킵한다. 코인 데이터는 run_daily가 이미 갱신해 둔 것을 읽는다.
"""
from __future__ import annotations
import os
import json
import datetime as dt

from .common import load_json, log, DATA, PLAYERS


def _today_kst() -> str:
    return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=9)).date().isoformat()


def _roster_names() -> dict:
    players = load_json(DATA / "roster.json", {}).get("players", [])
    return {p["playerId"]: p for p in players}


def compute_today_moves(today: str) -> dict:
    """오늘 경기한(마지막 캔들 날짜=today) 선수의 Δ(=close-open). {pid: {name, delta}}."""
    names = _roster_names()
    moves = {}
    for f in PLAYERS.glob("*.json"):
        d = load_json(f, None)
        if not d:
            continue
        candles = (d.get("coin") or {}).get("candles") or []
        if not candles:
            continue
        last = candles[-1]
        if last.get("date") != today:
            continue  # 오늘 경기 없음
        delta = round(last["close"] - last["open"], 1)
        pid = d["playerId"]
        moves[pid] = {"name": names.get(pid, {}).get("name", pid), "delta": delta}
    return moves


def _fmt(delta: float) -> str:
    arrow = "📈 떡상" if delta > 0 else "📉 떡락"
    return f"{'+' if delta > 0 else ''}{delta:g} {arrow}"


def send() -> int:
    today = _today_kst()
    moves = compute_today_moves(today)
    movers = {pid: m for pid, m in moves.items() if m["delta"] != 0}
    if not movers:
        log.info("notify: 오늘(%s) 코인 변동 없음 — 발송 스킵", today)
        return 0

    sa_raw = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
    if not sa_raw:
        log.info("notify: FIREBASE_SERVICE_ACCOUNT 없음 — 발송 스킵(로컬/포크)")
        return 0

    # firebase-admin은 notify.yml에서만 설치 → 지연 임포트
    import firebase_admin
    from firebase_admin import credentials, firestore, messaging

    if not firebase_admin._apps:
        firebase_admin.initialize_app(credentials.Certificate(json.loads(sa_raw)))
    fs = firestore.client()

    # 방송 대상 = |Δ| 최대
    top_pid = max(movers, key=lambda p: abs(movers[p]["delta"]))
    top = movers[top_pid]
    broadcast_body = f"오늘 최대 등락 · {top['name']} 코인 {_fmt(top['delta'])}"
    log.info("notify: 방송 대상 %s (%s)", top["name"], _fmt(top["delta"]))

    subs = [(s.id, s.to_dict()) for s in fs.collection("subscribers").stream()]
    subs = [(uid, d) for uid, d in subs if d and d.get("token")]
    log.info("notify: subscriber %d명", len(subs))

    dead = []  # (uid, token)

    def _send(token, title, body, msg_id, player_id):
        try:
            messaging.send(messaging.Message(
                token=token,
                data={"title": title, "body": body, "id": msg_id, "playerId": str(player_id)},
                webpush=messaging.WebpushConfig(headers={"Urgency": "high", "TTL": "86400"}),
            ))
            return True
        except messaging.UnregisteredError:
            dead.append(token)
            return False
        except Exception as e:  # 기타 오류는 로그만
            log.warning("notify: 발송 실패 %s: %s", token[:12], e)
            return False

    b_cnt = p_cnt = 0
    for uid, d in subs:
        token = d["token"]
        followed = set(d.get("followedPlayers") or [])
        # (1) 방송
        if _send(token, "트윈스 코인", broadcast_body, f"coin-top-{today}", top_pid):
            b_cnt += 1
        # (2) 개인화 — 방송 선수(top_pid)는 제외해 중복 방지
        mine = [(pid, movers[pid]) for pid in followed if pid in movers and pid != top_pid]
        if mine:
            mine.sort(key=lambda x: abs(x[1]["delta"]), reverse=True)
            summary = ", ".join(f"{m['name']} {'+' if m['delta']>0 else ''}{m['delta']:g}" for _, m in mine[:3])
            body = f"팔로우 선수 등락 · {summary}"
            if _send(token, "트윈스 코인", body, f"coin-follow-{today}-{uid}", mine[0][0]):
                p_cnt += 1

    # 만료 토큰 정리 (subscriber 문서의 token 필드 제거)
    for uid, d in subs:
        if d["token"] in dead:
            fs.collection("subscribers").document(uid).update({"token": firestore.DELETE_FIELD})
    log.info("notify: 방송 %d · 개인화 %d 발송, 만료토큰 %d 정리", b_cnt, p_cnt, len(dead))
    return 0


if __name__ == "__main__":
    send()
