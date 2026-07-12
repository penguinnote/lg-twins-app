"""Spike 3 FINAL — player game-by-game log -> cumulative AVG/OPS time series.

Source: https://www.koreabaseball.com/Record/Player/HitterDetail/Daily.aspx?playerId={ID}&ddlYear tab
Page renders one table PER MONTH; each data row is one game:
  [MM.DD, 상대, AVG_game, PA, AB, R, H, 2B, 3B, HR, RBI, SB, CS, BB, HBP, SO, GDP, AVG_cum]
AVG_cum (last col) is the site's own cumulative season AVG at that date -> we cross-check ours.
OPS we compute ourselves: OBP=(H+BB+HBP)/(AB+BB+HBP)  [SF not exposed -> minor approx],
  SLG=TB/AB where TB=H+2B+2*3B+3*HR ; OPS=OBP+SLG.
"""
import requests, sys
from bs4 import BeautifulSoup

PID = sys.argv[1] if len(sys.argv) > 1 else "52605"
YEAR = "2026"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
s = requests.Session(); s.headers.update({"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9"})

url = f"https://www.koreabaseball.com/Record/Player/HitterDetail/Daily.aspx?playerId={PID}"
soup = BeautifulSoup(s.get(url, timeout=15).text, "lxml")

# player name (fallback to id)
nm = soup.select_one(".player_info .name, .player_records .name, h4.h4, .p_info strong")
name = nm.get_text(strip=True) if nm else f"player#{PID}"
if not nm:  # try any element containing a name near top
    t = soup.select_one("title")
    name = f"player#{PID}"

COLS = ["date","opp","avg_g","PA","AB","R","H","2B","3B","HR","RBI","SB","CS","BB","HBP","SO","GDP","avg_cum"]
games = []
for t in soup.select("table"):
    heads = [th.get_text(strip=True) for th in t.select("th")]
    if not heads or "AVG1" not in heads:
        continue
    for tr in t.select("tbody tr"):
        cells = [c.get_text(strip=True) for c in tr.select("td")]
        if len(cells) < 18 or "없습니다" in cells[0] or "합계" in cells[0]:
            continue
        row = dict(zip(COLS, cells))
        games.append(row)

def num(x):
    try: return int(x)
    except: return 0

# cumulative time series
cum = {k: 0 for k in ["AB","H","2B","3B","HR","BB","HBP"]}
series = []
for g in games:
    for k in cum: cum[k] += num(g[k])
    AB, H = cum["AB"], cum["H"]
    tb = H + cum["2B"] + 2*cum["3B"] + 3*cum["HR"]
    obp_den = AB + cum["BB"] + cum["HBP"]
    avg = H/AB if AB else 0.0
    obp = (H + cum["BB"] + cum["HBP"])/obp_den if obp_den else 0.0
    slg = tb/AB if AB else 0.0
    date = f"{YEAR}-{g['date'].replace('.', '-')}"
    series.append((date, avg, obp+slg, g["avg_cum"]))

print(f"player={name} (id {PID}), season={YEAR}, games={len(games)}")
print(f"{'DATE':12} {'cumAVG':>7} {'cumOPS':>7}   site_cumAVG(check)")
print("-"*48)
# print first 5, last 8 to show the whole arc compactly
show = series[:5] + [("...", None, None, "")] + series[-8:] if len(series) > 13 else series
for date, avg, ops, site in show:
    if avg is None:
        print("   ...")
        continue
    print(f"{date:12} {avg:7.3f} {ops:7.3f}   {site}")

# final sanity
if series:
    d,a,o,site = series[-1]
    print("-"*48)
    print(f"season final: AVG={a:.3f} (site {site}), OPS={o:.3f}, "
          f"AB={cum['AB']} H={cum['H']} HR={cum['HR']} BB={cum['BB']}")
