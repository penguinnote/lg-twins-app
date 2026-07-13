"""투수 게임로그 → data/players/<playerId>.json (경기별 피칭 + 트윈스 코인).

소스: KBO 일자별 투구기록
  https://www.koreabaseball.com/Record/Player/PitcherDetail/Daily.aspx?playerId={ID}
월별 표, 각 행 = 등판 1회. 컬럼:
  날짜 | 상대 | 구분(선발/구원) | 결과 | ERA(경기) | TBF | IP | H | HR | BB | HBP | SO | R | ER | ERA(누적)
결과 컬럼에 승/패/세(세이브)/홀(홀드) 인코딩. 투구수는 미제공(TBF=상대타자수 대용).
"""
from __future__ import annotations
import datetime as dt

from bs4 import BeautifulSoup

from .common import make_session, save_json, log, PLAYERS
from .value_model import parse_ip, pitcher_value, build_candles, coin_block

URL = "https://www.koreabaseball.com/Record/Player/PitcherDetail/Daily.aspx?playerId={pid}"
COLS = ["date", "opp", "role", "result", "era_g", "TBF", "IP",
        "H", "HR", "BB", "HBP", "SO", "R", "ER", "era_cum"]


def _num(x) -> int:
    try:
        return int(x)
    except (ValueError, TypeError):
        return 0


def build_pitcher(pid: str, year: int | None = None) -> dict:
    year = year or dt.date.today().year
    s = make_session()
    soup = BeautifulSoup(s.get(URL.format(pid=pid), timeout=15).text, "lxml")

    rows = []
    for t in soup.select("table"):
        heads = [th.get_text(strip=True) for th in t.select("th")]
        if "TBF" not in heads or "ER" not in heads:
            continue
        for tr in t.select("tbody tr"):
            cells = [c.get_text(strip=True) for c in tr.select("td")]
            if len(cells) < 15 or "없습니다" in cells[0] or "합계" in cells[0]:
                continue
            rows.append(dict(zip(COLS, cells)))

    games, valued = [], []
    tot = {"IP": 0.0, "R": 0, "ER": 0, "SO": 0, "H": 0, "HR": 0, "BB": 0,
           "W": 0, "L": 0, "SV": 0, "HLD": 0}
    for r in rows:
        ip = parse_ip(r["IP"])
        res = r["result"]
        hld = 1 if "홀" in res else 0
        sv = 1 if "세" in res else 0
        w = 1 if res == "승" else 0
        l = 1 if res == "패" else 0
        stat = {"IP": ip, "R": _num(r["R"]), "HLD": hld, "SV": sv}
        v = pitcher_value(stat)
        date = f"{year}-{r['date'].replace('.', '-')}"
        games.append({
            "date": date, "opp": r["opp"], "role": r["role"], "result": res,
            "IP": ip, "TBF": _num(r["TBF"]), "H": _num(r["H"]), "HR": _num(r["HR"]),
            "BB": _num(r["BB"]), "HBP": _num(r["HBP"]), "SO": _num(r["SO"]),
            "R": _num(r["R"]), "ER": _num(r["ER"]), "era_cum": r["era_cum"],
        })
        valued.append({"date": date, "opp": r["opp"], "value": v})
        tot["IP"] += ip
        for k in ["R", "ER", "SO", "H", "HR", "BB"]:
            tot[k] += _num(r[k])
        tot["W"] += w; tot["L"] += l; tot["SV"] += sv; tot["HLD"] += hld

    tot["IP"] = round(tot["IP"], 3)
    candles = build_candles(valued)
    return {
        "playerId": pid,
        "season": year,
        "is_pitcher": True,
        "games": len(games),
        "updated": dt.datetime.now().isoformat(timespec="seconds"),
        "totals": tot,
        "pitching": games,
        "coin": coin_block(candles),
    }


def update_pitcher(pid: str, year: int | None = None) -> dict:
    data = build_pitcher(pid, year)
    save_json(PLAYERS / f"{pid}.json", data)
    return data


if __name__ == "__main__":
    import sys
    update_pitcher(sys.argv[1] if len(sys.argv) > 1 else "61101")
