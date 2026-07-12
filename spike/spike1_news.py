"""Spike 1 FINAL — Naver Sports KBO team news: headline + link + date (10 items).

Endpoint (returns JSON):
  https://sports.news.naver.com/kbaseball/news/list?isphoto=N&type=team&team={TEAM}&page=1
Team codes: LG, OB(두산), SS(삼성), LT(롯데), HT(KIA), SK(SSG), NC, WO(키움), HH(한화), KT
Article URL built from oid/aid. Headlines/links/date only — no article body.
"""
import requests, time, json, sys

TEAM = sys.argv[1] if len(sys.argv) > 1 else "LG"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36"
s = requests.Session()
s.headers.update({"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9",
                  "Referer": "https://sports.news.naver.com/kbaseball/news/index",
                  "X-Requested-With": "XMLHttpRequest"})

url = f"https://sports.news.naver.com/kbaseball/news/list?isphoto=N&type=team&team={TEAM}&page=1"
r = s.get(url, timeout=12)
time.sleep(1)  # be polite
data = r.json()
items = data.get("list", [])
print(f"team={TEAM}  status={r.status_code}  count={len(items)}")
if items:
    print("available fields:", sorted(items[0].keys()))
print("=" * 90)
for i, it in enumerate(items[:10], 1):
    oid, aid = it.get("oid"), it.get("aid")
    link = f"https://n.news.naver.com/mnews/article/{oid}/{aid}"
    date = it.get("datetime") or it.get("date") or it.get("regDateTime") or "?"
    print(f"{i:2}. [{date}] {it.get('title')}")
    print(f"     {it.get('officeName')}  |  {link}")
