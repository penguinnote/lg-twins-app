# ARCHITECTURE

_작성 예정 (코워크에서 문서화)._ 아래는 Phase 0 구현 중 확정된 사실 메모 — 코워크가 참고해 정리한다.

## 확정 데이터 소스 (엔드포인트)

| 데이터 | 엔드포인트 | 방식 | 비고 |
|--------|-----------|------|------|
| 팀 뉴스 | `GET sports.news.naver.com/kbaseball/news/list?isphoto=N&type=team&team=LG&page=N` | JSON | 헤더 `Referer: .../kbaseball/news/index`, `X-Requested-With: XMLHttpRequest`. 응답 `list[]`: oid·aid·title·datetime·officeName·url. **헤드라인·링크·날짜만 저장(본문 금지).** |
| 로스터 | `POST koreabaseball.com/Player/Register.aspx` | HTML(ASP.NET 포스트백) | 팀 전환: 히든 `hfSearchTeam=LG` + `__EVENTTARGET=...btnCalendarSelect`. 포지션 표의 선수 `<a>`가 `playerId` 보유. 감독·코치 제외. |
| 등록/말소 | `GET koreabaseball.com/Player/RegisterAll.aspx` | HTML | 하단 '당일 1군 등록/말소' 표(선수·포지션·팀). **'당일'만 제공 → 매일 폴링해 누적. 과거 소급·사유 없음.** |
| 선수 시계열 | `GET koreabaseball.com/Record/Player/HitterDetail/Daily.aspx?playerId=ID` | HTML | 월별 표, 행=경기. 누적 AVG = cumsum(H)/cumsum(AB) (사이트 누적 컬럼과 일치 검증). OPS는 계산(OBP+SLG, SF 미노출로 OBP 소폭 근사). |

## data/ 파일 구조

```
data/
  roster.json            # {team, updated, count, hitter_count, players:[{playerId,name,position,is_pitcher}]}
  news.json              # {team, updated, count, items:[{title,url,datetime,office,oid,aid}]}
  moves_history.json     # [{date, fetched_at, registered:[{name,position,team}], waived:[...]}]  (날짜별 append, 중복 방지)
  players/<playerId>.json# {playerId, season, games, totals, series:[{date,opp,cum_avg,cum_ops,site_cum_avg}]}
```

## 파이프라인 모듈 (`pipeline/`)

- `common.py` — 세션/헤더/경로/JSON/sleep + LG 상수(엔드포인트 교체 지점).
- `roster.py` · `news.py` · `moves.py` · `timeseries.py` — 소스별 독립 모듈.
- `run_daily.py` — 오케스트레이터. 단계별 try/except 격리, 요청 사이 sleep(1~2s),
  타자별 시계열 격리(한 선수 실패해도 전체 진행). 소스 전체 실패만 exit 1.

## 실행/스케줄

- 로컬: `python -m pipeline.run_daily`
- 자동: `.github/workflows/daily.yml` — 매일 KST 아침 1회(cron UTC) + `workflow_dispatch`.
  `data/` 변경분을 자동 커밋·푸시(`permissions: contents: write`). 이력이 커밋으로 축적된다.

## 가드레일

- 뉴스 본문 저장 금지(헤드라인·링크만). 요청 sleep·robots 존중. 개인/학습용.
- 데이터 권리는 KBO·네이버 소유 → 상업적 재배포 주의.
- 등록/말소는 **소급 불가**이므로 폴링 가동일부터가 이력의 시작점이다.
