"""LG 팀 뉴스 → data/news.json  (헤드라인·원문 URL·날짜만. 본문 전문 저장 금지)

소스(구 데스크톱 AJAX, JSON 반환):
  https://sports.news.naver.com/kbaseball/news/list?isphoto=N&type=team&team=LG&page=1

전날 인기뉴스 유지: news.json = 오늘 목록 + "전날에 있었지만 오늘 밀려난 것 상위 N개".
조회수(view/hit) 필드가 응답에 **없고**(확인함), 네이버 KBO 랭킹 엔드포인트도 없어(404),
'인기' 정렬 대신 **최신순 fallback**으로 밀려난 항목 중 최근 것을 유지한다(조회수 확보 시 교체).
매시간 도는 news.yml이 이 엔트리만 실행한다.
"""
from __future__ import annotations
import datetime as dt
import re

from .common import make_session, polite_sleep, save_json, load_json, log, DATA, TEAM_CODE

BASE = "https://sports.news.naver.com/kbaseball/news/list"
REFERER = "https://sports.news.naver.com/kbaseball/news/index"

CARRYOVER_MAX = 6        # 전날 유지 최대 개수(무한 누적 방지)
CARRYOVER_DAYS = 2       # 이보다 오래된 기사는 유지하지 않음("전날" 범위로 제한)


def fetch_news(team_code: str = TEAM_CODE, pages: int = 2) -> list[dict]:
    """팀 뉴스 최근 목록. 헤드라인/URL/날짜/언론사만 취한다(본문 미저장)."""
    s = make_session(referer=REFERER)
    s.headers["X-Requested-With"] = "XMLHttpRequest"
    items: list[dict] = []
    for page in range(1, pages + 1):
        url = f"{BASE}?isphoto=N&type=team&team={team_code}&page={page}"
        r = s.get(url, timeout=12)
        r.raise_for_status()
        for it in r.json().get("list", []):
            oid, aid = it.get("oid"), it.get("aid")
            items.append({
                "title": it.get("title"),
                "url": it.get("url") or f"https://n.news.naver.com/mnews/article/{oid}/{aid}",
                "datetime": it.get("datetime"),
                "office": it.get("officeName"),
                "oid": oid,
                "aid": aid,
            })
        polite_sleep()
    # oid/aid 기준 중복 제거, 최신순 유지
    seen, uniq = set(), []
    for it in items:
        key = (it["oid"], it["aid"])
        if key in seen:
            continue
        seen.add(key)
        uniq.append(it)
    return uniq


def _art_date(item: dict):
    """'2026.07.13 18:00' → date. 파싱 실패 시 None."""
    m = re.match(r"(\d{4})\.(\d{2})\.(\d{2})", item.get("datetime") or "")
    if not m:
        return None
    return dt.date(int(m.group(1)), int(m.group(2)), int(m.group(3)))


def _carryover(today: list[dict], prev: list[dict]) -> list[dict]:
    """전날 목록 중 오늘 밀려난 항목을 최신순 상위 N개 유지(조회수 없어 recency fallback)."""
    today_keys = {(i["oid"], i["aid"]) for i in today}
    cutoff = dt.date.today() - dt.timedelta(days=CARRYOVER_DAYS)
    pool = [
        i for i in prev
        if (i["oid"], i["aid"]) not in today_keys           # 오늘 목록에 없는(밀려난) 것
        and (_art_date(i) or dt.date.min) >= cutoff          # 너무 오래된 것 제외
    ]
    pool.sort(key=lambda i: i.get("datetime") or "", reverse=True)
    # carried 플래그를 붙여 프론트가 "이전 인기"로 구분할 수 있게 함
    return [{**{k: v for k, v in i.items() if k != "carried"}, "carried": True}
            for i in pool[:CARRYOVER_MAX]]


def update_news() -> list[dict]:
    today = fetch_news()
    prev = load_json(DATA / "news.json", {}).get("items", [])
    carried = _carryover(today, prev)
    items = today + carried                                  # 오늘(최신) 뒤에 유지분

    # 내용(items)이 그대로면 파일을 다시 쓰지 않는다 → 매시간 실행이라도 불필요한
    # 커밋(타임스탬프만 바뀌는)이 쌓이지 않게 한다. workflow의 git diff가 스킵을 판단.
    if items == prev:
        log.info("news: 변경 없음(오늘 %d + 유지 %d) — 파일 유지", len(today), len(carried))
        return items

    save_json(DATA / "news.json", {
        "team": TEAM_CODE,
        "updated": dt.datetime.now().isoformat(timespec="seconds"),
        "count": len(items),
        "carried_count": len(carried),
        "items": items,
    })
    log.info("news: 오늘 %d건 + 유지 %d건 = %d건 (갱신)", len(today), len(carried), len(items))
    return items


if __name__ == "__main__":
    update_news()
