"""선수 능력치 레이더(STATUS_RATINGS) — 리그 백분위 6축.

리그 전체(자격 충족) 분포 대비 백분위(0~100)로 6능력치를 낸다. 전부 박스스코어 기반.
수비·구속·회전수·멘탈은 공개 데이터가 없어 제외(코인 모델과 동일한 한계).

소스: KBO 시즌 리더보드(팀 필터로 전 선수 시즌합계)
  타자  https://www.koreabaseball.com/Record/Player/HitterBasic/BasicOld.aspx
  투수  https://www.koreabaseball.com/Record/Player/PitcherBasic/BasicOld.aspx
팀 드롭다운(ddlTeam) 포스트백으로 팀별 전 선수(규정 미달 포함)를 받아 합친다.
"""
from __future__ import annotations
import bisect
import datetime as dt

from bs4 import BeautifulSoup

from .common import make_session, save_json, load_json, log, DATA, PLAYERS
from .value_model import CONST, parse_ip

MIN_PA = 50     # 타자 자격
MIN_IP = 10     # 투수 자격
TEAMS = ["SS", "LG", "KT", "HT", "OB", "HH", "NC", "LT", "SK", "WO"]
FIP_CONST = 3.20

HIT_URL = "https://www.koreabaseball.com/Record/Player/HitterBasic/BasicOld.aspx"
PIT_URL = "https://www.koreabaseball.com/Record/Player/PitcherBasic/BasicOld.aspx"

# 축 정의: (key, 라벨, reverse=낮을수록 좋음)
HIT_AXES = [
    ("contact", "컨택", False), ("power", "파워", False), ("eye", "선구안", False),
    ("speed", "주력", False), ("avoidK", "삼진회피", True), ("production", "생산성", False),
]
PIT_AXES = [
    ("control", "제구", True), ("strikeout", "탈삼진", False), ("hits", "피안타억제", True),
    ("homers", "장타억제", True), ("innings", "이닝소화", False), ("run_prevention", "실점억제", True),
]


def _hidden(soup):
    return {i.get("name"): (i.get("value") or "")
            for i in soup.select("input[type=hidden]") if i.get("name")}


def _num(x):
    try:
        return int(str(x).replace(",", ""))
    except (ValueError, TypeError):
        return 0


def _scrape(url: str) -> list[dict]:
    """팀 드롭다운을 돌려 전 팀 선수의 시즌합계 행을 반환(팀코드 태그)."""
    s = make_session(referer=url)
    soup = BeautifulSoup(s.get(url, timeout=20).text, "lxml")
    base = _hidden(soup)
    team_sel = soup.select_one("select[id*=ddlTeam]")
    tname = team_sel.get("name")
    # 모든 select의 현재값 유지
    sel_vals = {}
    for sel in soup.select("select"):
        nm = sel.get("name")
        if not nm:
            continue
        opt = sel.select_one("option[selected]") or sel.select_one("option")
        sel_vals[nm] = opt.get("value") if opt else ""

    rows = []
    for team in TEAMS:
        form = dict(base)
        form.update(sel_vals)
        form["__EVENTTARGET"] = tname
        form["__EVENTARGUMENT"] = ""
        form[tname] = team
        r = s.post(url, data=form, timeout=20)
        tsoup = BeautifulSoup(r.text, "lxml")
        for t in tsoup.select("table"):
            heads = [th.get_text(strip=True) for th in t.select("th")]
            if "선수명" not in heads:
                continue
            idx = {h: i for i, h in enumerate(heads)}
            for tr in t.select("tbody tr"):
                cells = [c.get_text(strip=True) for c in tr.select("td")]
                if len(cells) < len(heads) or "없습니다" in cells[0]:
                    continue
                rec = {h: cells[idx[h]] for h in heads}
                rec["_team"] = team
                rows.append(rec)
        from time import sleep
        sleep(1.2)  # 예의
    return rows


# ── 지표 계산 ───────────────────────────────────────────────────────────
def hitter_metrics(r: dict) -> dict:
    ab, h = _num(r.get("AB")), _num(r.get("H"))
    d2, d3, hr = _num(r.get("2B")), _num(r.get("3B")), _num(r.get("HR"))
    bb, hbp, so = _num(r.get("BB")), _num(r.get("HBP")), _num(r.get("SO"))
    pa, sb = _num(r.get("PA")), _num(r.get("SB"))
    avg = h / ab if ab else 0.0
    tb = h + d2 + 2 * d3 + 3 * hr
    slg = tb / ab if ab else 0.0
    b1 = max(h - d2 - d3 - hr, 0)
    wden = ab + bb + hbp
    woba = ((CONST["w_BB"] * bb + CONST["w_HBP"] * hbp + CONST["w_1B"] * b1
             + CONST["w_2B"] * d2 + CONST["w_3B"] * d3 + CONST["w_HR"] * hr) / wden) if wden else 0.0
    return {
        "PA": pa,
        "contact": round(avg, 3), "power": round(slg - avg, 3),
        "eye": round(bb / pa, 3) if pa else 0.0, "speed": sb + d3,
        "avoidK": round(so / pa, 3) if pa else 0.0, "production": round(woba, 3),
    }


def pitcher_metrics(r: dict) -> dict:
    ip = parse_ip(r.get("IP", ""))
    h, hr = _num(r.get("H")), _num(r.get("HR"))
    bb, hbp, so = _num(r.get("BB")), _num(r.get("HBP")), _num(r.get("SO"))
    tbf = _num(r.get("TBF"))
    abf = max(tbf - bb - hbp, 0)  # 상대타수 근사(SF·SH 미제공)
    fip = ((13 * hr + 3 * (bb + hbp) - 2 * so) / ip + FIP_CONST) if ip else 0.0
    return {
        "IP": round(ip, 1),
        "control": round(bb * 9 / ip, 2) if ip else 99.0,
        "strikeout": round(so * 9 / ip, 2) if ip else 0.0,
        "hits": round(h / abf, 3) if abf else 1.0,
        "homers": round(hr * 9 / ip, 2) if ip else 99.0,
        "innings": round(ip, 1),
        "run_prevention": round(fip, 2),
    }


def _percentile(value, sorted_vals: list, reverse: bool) -> int:
    """자격 분포에서 '나보다 나쁜 선수 비율' × 100. reverse=낮을수록 좋음."""
    n = len(sorted_vals)
    if n == 0:
        return 0
    if reverse:  # 값이 클수록 나쁨 → 나보다 큰 선수 수
        worse = n - bisect.bisect_right(sorted_vals, value)
    else:        # 값이 클수록 좋음 → 나보다 작은 선수 수
        worse = bisect.bisect_left(sorted_vals, value)
    return max(0, min(100, round(worse / n * 100)))


def _distribution(metrics_list: list[dict], axes) -> dict:
    """자격 선수들의 축별 정렬 분포."""
    dist = {}
    for key, _, _ in axes:
        vals = sorted(m[key] for m in metrics_list)
        dist[key] = vals
    return dist


def _ratings_for(metrics: dict, dist: dict, axes, low: bool) -> dict:
    out_axes = []
    for key, label, reverse in axes:
        rating = _percentile(metrics[key], dist.get(key, []), reverse)
        out_axes.append({"key": key, "label": label, "value": metrics[key], "rating": rating})
    ovr = round(sum(a["rating"] for a in out_axes) / len(out_axes))
    return {"OVR": ovr, "lowSample": low, "axes": out_axes}


def update_ratings(players: list[dict]) -> dict:
    """리그 분포 스크랩 → league.json 저장 + LG 선수별 ratings를 player 파일에 병합."""
    hit_rows = _scrape(HIT_URL)
    pit_rows = _scrape(PIT_URL)
    log.info("ratings: 리그 타자 %d행 · 투수 %d행 수집", len(hit_rows), len(pit_rows))

    # 지표 계산 + 자격 분포
    hit_m = [(r, hitter_metrics(r)) for r in hit_rows]
    pit_m = [(r, pitcher_metrics(r)) for r in pit_rows]
    hit_qual = [m for _, m in hit_m if m["PA"] >= MIN_PA]
    pit_qual = [m for _, m in pit_m if m["IP"] >= MIN_IP]
    hit_dist = _distribution(hit_qual, HIT_AXES)
    pit_dist = _distribution(pit_qual, PIT_AXES)

    save_json(DATA / "league.json", {
        "updated": dt.datetime.now().isoformat(timespec="seconds"),
        "season": dt.date.today().year,
        "qualifiers": {
            "hitter": {"minPA": MIN_PA, "count": len(hit_qual)},
            "pitcher": {"minIP": MIN_IP, "count": len(pit_qual)},
        },
        "hitter": {"axes": hit_dist},
        "pitcher": {"axes": pit_dist},
    })

    # LG 선수 이름 → 스크랩 레코드(팀=LG)
    lg_hit = {r["선수명"]: m for r, m in hit_m if r["_team"] == "LG"}
    lg_pit = {r["선수명"]: m for r, m in pit_m if r["_team"] == "LG"}

    ok = 0
    for p in players:
        pid, name, is_p = p["playerId"], p["name"], p.get("is_pitcher")
        try:
            if is_p:
                m = lg_pit.get(name)
                if not m:
                    continue
                ratings = _ratings_for(m, pit_dist, PIT_AXES, m["IP"] < MIN_IP)
                ratings["type"] = "pitcher"
            else:
                m = lg_hit.get(name)
                if not m:
                    continue
                ratings = _ratings_for(m, hit_dist, HIT_AXES, m["PA"] < MIN_PA)
                ratings["type"] = "hitter"
            path = PLAYERS / f"{pid}.json"
            data = load_json(path, None)
            if data is None:
                continue
            data["ratings"] = ratings
            save_json(path, data)
            ok += 1
        except Exception as e:
            log.warning("  ratings 실패 %s(%s): %s", name, pid, e)
    log.info("ratings: %d명 능력치 저장 (자격 타자 %d·투수 %d)", ok, len(hit_qual), len(pit_qual))
    return {"hit_qual": len(hit_qual), "pit_qual": len(pit_qual), "rated": ok}


if __name__ == "__main__":
    roster = load_json(DATA / "roster.json", {}).get("players", [])
    update_ratings(roster)
