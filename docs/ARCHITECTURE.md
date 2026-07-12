# 아키텍처 (ARCHITECTURE)

이 프로젝트의 엔지니어링 핵심은 **KBO 데이터를 매일 자동 수집·정제하는 파이프라인**이다.
KBO는 공개 API가 없어, 검증된 스크래퍼로 데이터를 모으고 JSON으로 떨궈 웹사이트가 읽는다.

## 전체 구조

```
[GitHub Actions · 매일 08:00 KST]
        │  python pipeline/run_daily.py
        ▼
  ┌───────────── pipeline/ ─────────────┐
  │ roster.py   뉴스.py   moves.py   timeseries.py │
  └───────────────────┬─────────────────┘
                      ▼
              data/ (JSON 산출)
   roster.json · news.json · moves_history.json · players/<id>.json
                      │  (Actions가 자동 커밋)
                      ▼
             [웹사이트(React)] ← Phase 1에서 이 JSON을 읽어 렌더
```

## 데이터 소스 (스파이크로 검증한 확정 엔드포인트)

| 데이터 | 엔드포인트 | 방식 |
|---|---|---|
| 뉴스 | `sports.news.naver.com/kbaseball/news/list?type=team&team=LG` | JSON. 헤드라인·URL·날짜만 |
| 로스터 | `koreabaseball.com/Player/Register.aspx` (포스트백 `hfSearchTeam=LG`) | HTML. playerId 추출 |
| 등록/말소 | `koreabaseball.com/Player/RegisterAll.aspx` (당일 위젯) | HTML. 매일 폴링·누적 |
| 선수 시계열 | `.../HitterDetail/Daily.aspx?playerId=<ID>` | HTML. 경기별 로그 → 누적 AVG/OPS |

## 수집기별 설계

- **roster.py** — LG 현재 선수단 playerId 목록을 `data/roster.json`으로. 시계열 수집의 입력.
- **news.py** — LG 뉴스 목록을 `data/news.json`으로. 저작권상 **헤드라인·원문 링크·날짜만**
  저장하고 본문은 저장하지 않는다.
- **moves.py** — 등록/말소는 **당일만** 제공되고 소급이 불가하다. 매일 스냅샷을 찍어
  `data/moves_history.json`에 **날짜별로 append**(중복 방지)해 이력을 스스로 축적한다.
- **timeseries.py** — 선수 경기별 로그를 모아 경기 종료 시점마다 누적 타율/OPS를 계산,
  `data/players/<playerId>.json` 시계열로 저장. 과거 소급 복원이 가능하다.

## 시계열 복원과 검증 (신뢰도의 핵심)

"주식 차트" 기능의 원천은 **경기별 로그로 역산한 누적 스탯 시계열**이다. 신뢰도를 확보하기 위해,
직접 계산한 누적 타율을 KBO가 제공하는 공식 누적 컬럼과 매 시점 대조했다.

- 타자 **15명 전원의 누적 타율이 공식값과 정확히 일치 (15/15, 불일치 0).**
- 즉 화면에 그릴 시계열이 공식 기록과 동일함을 보장한다.

## 자동화 (GitHub Actions)

- `.github/workflows/daily.yml` — 매일 08:00 KST(cron `0 23 * * *` UTC) + 수동 실행(workflow_dispatch).
- `run_daily.py` 실행 → `data/` 변경분을 기본 `GITHUB_TOKEN`으로 자동 커밋·푸시(추가 시크릿 불필요).
- `permissions: contents: write`.

## 저장 구조

```
data/
├── roster.json            # LG 선수단 (playerId 등)
├── news.json              # 최근 뉴스 (헤드라인·URL·날짜)
├── moves_history.json     # 등록/말소 누적 이력 (2026-07-12~)
└── players/<playerId>.json # 선수별 누적 타율/OPS 시계열
```

MVP는 읽기 전용·일 배치라 DB 없이 JSON으로 충분하다. 계정·알림이 필요해지면 Firestore로 승격한다.

## 견고성 · 법적 고려

- **저작권/ToS** — 뉴스는 헤드라인·링크만, 본문 복사·저장 금지. rate-limit(요청 간 sleep), robots 존중,
  개인/학습용.
- **장애 격리** — 한 선수/한 소스가 실패해도 전체 배치가 죽지 않도록 try/except로 격리.
- **스크래퍼 취약성** — 네이버/KBO 구조 변경 시 깨질 수 있어, 소스별 모듈로 분리해 교체를 쉽게 했다.

## 한계 · 향후

- 등록/말소는 소급 불가 → 이력은 수집 시작일(2026-07-12)부터 쌓인다.
- 뉴스 엔드포인트는 구 버전이라 변경 가능성 있음 → 모듈 교체로 대응.
- Phase 2에서 로스터 이동 "사유"를 뉴스+LLM으로 생성, Phase 3에서 승부 예측 모델을 얹을 예정.
