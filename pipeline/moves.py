"""등록/말소 이력 → data/moves_history.json (오늘 스냅샷 append, 날짜별 중복 방지)

소스: KBO 전체 등록현황 (https://www.koreabaseball.com/Player/RegisterAll.aspx)
하단 '당일 1군 등록' / '당일 1군 말소' 위젯(컬럼: 선수 | 포지션 | 팀).
KBO는 '당일'만 제공하고 과거 소급/사유가 없으므로 **매일 폴링해 fetch일과 함께 누적**한다.
LG 한 팀만 대상이므로 팀 컬럼이 LG인 항목만 저장한다.
"""
from __future__ import annotations
import datetime as dt

from bs4 import BeautifulSoup

from .common import make_session, save_json, load_json, log, DATA, TEAM_NAME

URL = "https://www.koreabaseball.com/Player/RegisterAll.aspx"


def _parse_move_tables(soup) -> tuple[list, list]:
    """(등록, 말소) 각각 [{name, position, team}] 리스트로 반환."""
    move_tables = [t for t in soup.select("table")
                   if [th.get_text(strip=True) for th in t.select("th")] == ["선수", "포지션", "팀"]]

    def rows(t):
        out = []
        for tr in t.select("tbody tr"):
            cells = [c.get_text(strip=True) for c in tr.select("td")]
            if len(cells) >= 3 and "없습니다" not in cells[0]:
                out.append({"name": cells[0], "position": cells[1], "team": cells[2]})
        return out

    if len(move_tables) < 2:
        return [], []
    return rows(move_tables[0]), rows(move_tables[1])


def _lg_only(rows: list[dict]) -> list[dict]:
    return [r for r in rows if TEAM_NAME in (r.get("team") or "")]


def fetch_today_moves() -> dict:
    s = make_session(referer=URL)
    soup = BeautifulSoup(s.get(URL, timeout=15).text, "lxml")
    registered, waived = _parse_move_tables(soup)
    today = dt.date.today().isoformat()
    return {
        "date": today,
        "fetched_at": dt.datetime.now().isoformat(timespec="seconds"),
        "registered": _lg_only(registered),   # 1군 등록
        "waived": _lg_only(waived),            # 1군 말소
    }


def append_moves() -> dict:
    """오늘 스냅샷을 이력에 append. 같은 날짜가 이미 있으면 최신 값으로 대체(중복 방지)."""
    path = DATA / "moves_history.json"
    history = load_json(path, [])
    if not isinstance(history, list):
        history = []
    today = fetch_today_moves()
    history = [h for h in history if h.get("date") != today["date"]]  # 같은 날 제거
    history.append(today)
    history.sort(key=lambda h: h["date"])
    save_json(path, history)
    log.info("moves: %s 등록 %d / 말소 %d (누적 %d일)",
             today["date"], len(today["registered"]), len(today["waived"]), len(history))
    return today


if __name__ == "__main__":
    append_moves()
