"""팀 경기 마스터 날짜축 → data/games.json

전 선수 경기별 로그 날짜의 합집합 = LG 팀 전체 경기 일정. 이 마스터 축에 선수 시계열을
정렬하면(안 뛴 날=짝대기) 모든 선수의 봉 개수가 동일해진다.
"""
from __future__ import annotations
import datetime as dt

from .common import load_json, save_json, log, DATA, PLAYERS


def update_games() -> list[str]:
    dates = set()
    for f in PLAYERS.glob("*.json"):
        d = load_json(f, None)
        if not d:
            continue
        for c in (d.get("coin") or {}).get("candles") or []:
            if c.get("date"):
                dates.add(c["date"])
    ordered = sorted(dates)
    save_json(DATA / "games.json", {
        "updated": dt.datetime.now().isoformat(timespec="seconds"),
        "season": dt.date.today().year,
        "count": len(ordered),
        "dates": ordered,
    })
    log.info("games: 팀 경기 %d일", len(ordered))
    return ordered


if __name__ == "__main__":
    update_games()
