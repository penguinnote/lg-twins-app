"""선수 게임로그 → data/players/<playerId>.json (누적 타율/OPS 시계열)

소스: KBO 일자별 타격기록
  https://www.koreabaseball.com/Record/Player/HitterDetail/Daily.aspx?playerId={ID}
월별 표의 각 데이터 행 = 경기 1개. 컬럼:
  날짜 | 상대 | AVG(경기) | PA AB R H 2B 3B HR RBI SB CS BB HBP SO GDP | AVG(누적)
누적 타율은 우리가 cumsum(H)/cumsum(AB)로 재계산(사이트 누적 컬럼과 일치 검증됨).
OPS = OBP + SLG.  OBP=(H+BB+HBP)/(AB+BB+HBP)[SF 미노출 근사], SLG=TB/AB, TB=H+2B+2*3B+3*HR.
"""
from __future__ import annotations
import datetime as dt

from bs4 import BeautifulSoup

from .common import make_session, save_json, log, PLAYERS

URL = "https://www.koreabaseball.com/Record/Player/HitterDetail/Daily.aspx?playerId={pid}"
COLS = ["date", "opp", "avg_g", "PA", "AB", "R", "H", "2B", "3B", "HR",
        "RBI", "SB", "CS", "BB", "HBP", "SO", "GDP", "avg_cum"]


def _num(x) -> int:
    try:
        return int(x)
    except (ValueError, TypeError):
        return 0


def build_series(pid: str, year: int | None = None) -> dict:
    """playerId의 시즌 게임로그를 누적 AVG/OPS 시계열로 변환."""
    year = year or dt.date.today().year
    s = make_session()
    soup = BeautifulSoup(s.get(URL.format(pid=pid), timeout=15).text, "lxml")

    games = []
    for t in soup.select("table"):
        heads = [th.get_text(strip=True) for th in t.select("th")]
        if "AVG1" not in heads:
            continue
        for tr in t.select("tbody tr"):
            cells = [c.get_text(strip=True) for c in tr.select("td")]
            if len(cells) < 18 or "없습니다" in cells[0] or "합계" in cells[0]:
                continue
            games.append(dict(zip(COLS, cells)))

    cum = {k: 0 for k in ["AB", "H", "2B", "3B", "HR", "BB", "HBP"]}
    series = []
    for g in games:
        for k in cum:
            cum[k] += _num(g[k])
        ab, h = cum["AB"], cum["H"]
        tb = h + cum["2B"] + 2 * cum["3B"] + 3 * cum["HR"]
        obp_den = ab + cum["BB"] + cum["HBP"]
        avg = round(h / ab, 3) if ab else 0.0
        obp = (h + cum["BB"] + cum["HBP"]) / obp_den if obp_den else 0.0
        slg = tb / ab if ab else 0.0
        series.append({
            "date": f"{year}-{g['date'].replace('.', '-')}",
            "opp": g["opp"],
            "cum_avg": avg,
            "cum_ops": round(obp + slg, 3),
            "site_cum_avg": g["avg_cum"],   # 교차검증용(사이트 누적)
        })
    return {
        "playerId": pid,
        "season": year,
        "games": len(series),
        "updated": dt.datetime.now().isoformat(timespec="seconds"),
        "totals": {k: cum[k] for k in cum},
        "series": series,
    }


def update_player(pid: str, year: int | None = None) -> dict:
    data = build_series(pid, year)
    save_json(PLAYERS / f"{pid}.json", data)
    return data


if __name__ == "__main__":
    import sys
    update_player(sys.argv[1] if len(sys.argv) > 1 else "69102")
