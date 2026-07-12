"""LG 팀 뉴스 → data/news.json  (헤드라인·원문 URL·날짜만. 본문 전문 저장 금지)

소스(구 데스크톱 AJAX, JSON 반환):
  https://sports.news.naver.com/kbaseball/news/list?isphoto=N&type=team&team=LG&page=1
"""
from __future__ import annotations
import datetime as dt

from .common import make_session, polite_sleep, save_json, load_json, log, DATA, TEAM_CODE

BASE = "https://sports.news.naver.com/kbaseball/news/list"
REFERER = "https://sports.news.naver.com/kbaseball/news/index"


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


def update_news() -> list[dict]:
    items = fetch_news()
    save_json(DATA / "news.json", {
        "team": TEAM_CODE,
        "updated": dt.datetime.now().isoformat(timespec="seconds"),
        "count": len(items),
        "items": items,
    })
    log.info("news: %d건", len(items))
    return items


if __name__ == "__main__":
    update_news()
