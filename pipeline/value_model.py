"""트윈스 코인 — 가치 모델(VALUE_MODEL).

경기별 박스스코어로 "그날의 가치 기여(runs)"를 계산하고, 이를 누적해 코인 가격을 만든다.
잘한 경기=상승(떡상), 못한 경기=하락(떡락). WPA·수비·클러치는 KBO 공개데이터에 없어 제외(스파이크2 확정).

- 타자: wOBA 선형가중치 → wRAA(평균 대비 타격 런) + 주루보정(SB/CS)
- 투수: 막아낸 실점(RP = 평균투수 예상실점 − 실제실점) + 역할 보너스(홀드/세이브, 휴리스틱)
- 코인가격: price_i = price_{i-1} + value_i × SCALE, base=100

리그 상수는 연도·리그 의존값. v1은 대표값으로 시작하고 리그 집계가 쌓이면 보정한다(수동/자체산출).
"""
from __future__ import annotations

# ── 리그 상수 (KBO 2026 v1 대표값 — 리그 집계 쌓이면 보정) ──────────────
CONST = {
    "year": 2026,
    "source": "v1-representative",   # 리그 자체집계 전 대표값
    # 타자 선형가중치(wOBA)
    "w_BB": 0.69, "w_HBP": 0.72, "w_1B": 0.89,
    "w_2B": 1.27, "w_3B": 1.62, "w_HR": 2.10,
    "lgwOBA": 0.335,
    "wOBA_scale": 1.20,
    # 주루(도루/도루자) 런값
    "run_SB": 0.20, "run_CS": -0.42,
    # 투수
    "lgRA9": 4.80,                   # 리그 9이닝당 실점
    "bonus_HLD": 0.30, "bonus_SV": 0.50,
}

# ── 코인 스케일(표현용) ─────────────────────────────────────────────────
COIN_BASE = 100.0
COIN_SCALE = 5.0


def parse_ip(text: str) -> float:
    """'5 2/3' → 5.667, '2/3' → 0.667, '6' → 6.0 (KBO 이닝 분수표기 파싱)."""
    if not text:
        return 0.0
    text = text.strip()
    whole, frac = 0.0, 0.0
    parts = text.split()
    for p in parts:
        if "/" in p:
            a, b = p.split("/")
            try:
                frac = float(a) / float(b)
            except (ValueError, ZeroDivisionError):
                frac = 0.0
        else:
            try:
                whole = float(p)
            except ValueError:
                whole = 0.0
    return round(whole + frac, 3)


def hitter_value(g: dict, c: dict = CONST) -> float:
    """타자 그날 가치(runs) = wRAA + 주루보정. g는 정수 스탯 dict."""
    ab = g.get("AB", 0); h = g.get("H", 0)
    d2 = g.get("2B", 0); d3 = g.get("3B", 0); hr = g.get("HR", 0)
    bb = g.get("BB", 0); hbp = g.get("HBP", 0)
    sb = g.get("SB", 0); cs = g.get("CS", 0)
    b1 = max(h - d2 - d3 - hr, 0)                      # 1루타 유도
    denom = ab + bb + hbp                              # SF 없음 → 생략(근사)
    pa = ab + bb + hbp                                 # PA ≈ AB+BB+HBP
    if denom > 0:
        woba = (c["w_BB"] * bb + c["w_HBP"] * hbp + c["w_1B"] * b1
                + c["w_2B"] * d2 + c["w_3B"] * d3 + c["w_HR"] * hr) / denom
        wraa = ((woba - c["lgwOBA"]) / c["wOBA_scale"]) * pa
    else:
        wraa = 0.0
    baserun = c["run_SB"] * sb + c["run_CS"] * cs
    return round(wraa + baserun, 4)


def pitcher_value(g: dict, c: dict = CONST) -> float:
    """투수 그날 가치(runs) = 막아낸 실점(RP) + 역할 보너스(홀드/세이브)."""
    ip = g.get("IP", 0.0)
    r = g.get("R", 0)
    rp = (c["lgRA9"] / 9.0) * ip - r                   # 평균투수 예상실점 − 실제실점
    bonus = c["bonus_HLD"] * g.get("HLD", 0) + c["bonus_SV"] * g.get("SV", 0)
    return round(rp + bonus, 4)


def build_candles(games: list[dict], value_key: str = "value",
                  base: float = COIN_BASE, scale: float = COIN_SCALE) -> list[dict]:
    """가치 시퀀스 → 코인 캔들. open=직전 close, close=open+value×scale."""
    candles = []
    prev = base
    for g in games:
        v = g.get(value_key, 0.0)
        opn = prev
        cls = round(opn + v * scale, 3)
        candles.append({
            "date": g["date"],
            "opp": g.get("opp", ""),
            "open": round(opn, 3),
            "close": cls,
            "value": round(v, 4),
        })
        prev = cls
    return candles


def coin_block(candles: list[dict]) -> dict:
    return {
        "base": COIN_BASE,
        "scale": COIN_SCALE,
        "constants": CONST,
        "candles": candles,
    }
