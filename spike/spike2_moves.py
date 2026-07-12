"""Spike 2 FINAL — KBO official 1군 등록/말소 (entry changes).

Source: https://www.koreabaseball.com/Player/RegisterAll.aspx
The page renders TWO widgets: '당일 1군 등록' and '당일 1군 말소' (선수/포지션/팀).
- Date is IMPLICIT = the actual current day. hfSearchDate drives only the roster
  snapshot, NOT the move widget, so there is no per-date history on this page.
- '사유'(reason) column: ABSENT in the source. Only 선수/포지션/팀 are provided.
=> For a recent feed, the app must POLL this page daily and accumulate with the
   fetch date attached (start-from-launch collection).
"""
import requests, datetime
from bs4 import BeautifulSoup

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
URL = "https://www.koreabaseball.com/Player/RegisterAll.aspx"
s = requests.Session()
s.headers.update({"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", "Referer": URL})

r = s.get(URL, timeout=15)
soup = BeautifulSoup(r.text, "lxml")
today = datetime.date.today().isoformat()

def parse_move_table(t):
    rows = []
    for tr in t.select("tbody tr"):
        cells = [c.get_text(strip=True) for c in tr.select("td")]
        if cells and "없습니다" not in cells[0]:
            rows.append(cells)  # [선수, 포지션, 팀]
    return rows

reg, wai = [], []
for t in soup.select("table"):
    heads = [th.get_text(strip=True) for th in t.select("th")]
    if heads == ["선수", "포지션", "팀"]:
        label_area = t.find_parent().get_text() if t.find_parent() else ""
        # distinguish 등록 vs 말소 by the caption text preceding the table
        prev = t.find_previous(string=lambda x: x and ("등록" in x or "말소" in x))
        bucket = reg if (prev and "등록" in prev) else wai
        # fallback: first such table = 등록, second = 말소
        bucket.extend(parse_move_table(t))

# robust order fallback if caption detection ambiguous
move_tables = [t for t in soup.select("table")
               if [th.get_text(strip=True) for th in t.select("th")] == ["선수", "포지션", "팀"]]
if len(move_tables) == 2 and not reg and not wai:
    reg = parse_move_table(move_tables[0]); wai = parse_move_table(move_tables[1])

print(f"fetch_date={today}  (KBO '당일' widget = this calendar day)")
print(f"1군 등록: {len(reg)}건 / 1군 말소: {len(wai)}건")
print("컬럼: 선수 | 포지션 | 팀   (날짜=fetch일 암묵, 사유=원천에 없음)")
print("-" * 60)
for name, pos, team in reg:
    print(f"[등록] {team:4} {name} ({pos})  {today}")
for name, pos, team in wai:
    print(f"[말소] {team:4} {name} ({pos})  {today}")
if not reg and not wai:
    print("(오늘은 이동 없음 — 2026 올스타 브레이크로 7/9~7/11 경기 없음)")
