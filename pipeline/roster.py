"""LG 로스터 스크래퍼 → data/roster.json

소스: KBO 구단별 등록현황 (https://www.koreabaseball.com/Player/Register.aspx)
팀 전환은 ASP.NET 포스트백: hfSearchTeam='LG' + __EVENTTARGET=...btnCalendarSelect.
각 포지션 표(감독/코치/투수/포수/내야수/외야수)의 선수 이름 <a>가 playerId를 담는다.
감독·코치는 제외하고 선수만 저장. 투수는 타격 시계열 제외용으로 is_pitcher 플래그.
"""
from __future__ import annotations
import re
import datetime as dt

from bs4 import BeautifulSoup

from .common import make_session, save_json, log, DATA, TEAM_CODE

URL = "https://www.koreabaseball.com/Player/Register.aspx"
EVENT_TARGET = "ctl00$ctl00$ctl00$cphContents$cphContents$cphContents$btnCalendarSelect"
PLAYER_POSITIONS = {"투수", "포수", "내야수", "외야수"}
HITTER_POSITIONS = {"포수", "내야수", "외야수"}


def _hidden_fields(soup) -> dict:
    return {i.get("name"): (i.get("value") or "")
            for i in soup.select("input[type=hidden]") if i.get("name")}


def fetch_roster(team_code: str = TEAM_CODE) -> list[dict]:
    """해당 팀의 선수 목록을 [{playerId, name, position, is_pitcher}] 로 반환."""
    s = make_session(referer=URL)
    soup = BeautifulSoup(s.get(URL, timeout=15).text, "lxml")
    form = _hidden_fields(soup)
    form["__EVENTTARGET"] = EVENT_TARGET
    form["__EVENTARGUMENT"] = ""
    for k in list(form):
        if k.endswith("hfSearchTeam"):
            form[k] = team_code
    soup = BeautifulSoup(s.post(URL, data=form, timeout=15).text, "lxml")

    players, seen = [], set()
    for t in soup.select("table"):
        ths = [th.get_text(strip=True) for th in t.select("th")]
        if len(ths) < 2:
            continue
        position = ths[1]                      # 표 제목 열 = 포지션(또는 감독/코치)
        if position not in PLAYER_POSITIONS:
            continue
        for a in t.select("a[href*=playerId]"):
            m = re.search(r"playerId=(\d+)", a.get("href", ""))
            if not m:
                continue
            pid = m.group(1)
            if pid in seen:
                continue
            seen.add(pid)
            players.append({
                "playerId": pid,
                "name": a.get_text(strip=True),
                "position": position,
                "is_pitcher": position == "투수",
            })
    return players


def update_roster() -> list[dict]:
    players = fetch_roster()
    if not players:
        raise RuntimeError("로스터가 비어있음 — 소스 구조 변경 의심")
    hitters = [p for p in players if not p["is_pitcher"]]
    save_json(DATA / "roster.json", {
        "team": TEAM_CODE,
        "updated": dt.date.today().isoformat(),
        "count": len(players),
        "hitter_count": len(hitters),
        "players": players,
    })
    log.info("roster: %d명 (타자 %d, 투수 %d)",
             len(players), len(hitters), len(players) - len(hitters))
    return players


if __name__ == "__main__":
    update_roster()
