# 아키텍처 (ARCHITECTURE)

이 프로젝트의 엔지니어링 핵심은 두 층이다: (1) KBO 경기별 기록을 매일 수집하는 **데이터
파이프라인**, (2) 그 기록으로 **선수 가치(코인 가격)를 계산하는 가치 모델**. KBO는 공개 API가
없어 검증된 스크래퍼로 수집하고, 계산 결과를 JSON으로 떨궈 웹사이트(캔들 차트)가 읽는다.

## 전체 구조

```
[GitHub Actions · 매일]
   │  python pipeline/run_daily.py
   ▼
 스크래퍼 (roster · news · timeseries[타자] · pitcher[투수] · moves)
   │
   ▼
 가치 모델 (value_model.py) — 경기별 가치(runs) → 누적 코인 가격(open/close)
   │
   ▼
 data/ JSON  (선수별 코인 가격 시계열 · 뉴스 · 로스터)
   │  (Actions가 자동 커밋)
   ▼
 웹사이트 (React) — 코인 시세판 · 캔들 차트(web/CandleChart.jsx)
```

## 데이터 소스 (스파이크 1·2로 검증한 확정 엔드포인트)

| 데이터 | 엔드포인트 | 방식 |
|---|---|---|
| 뉴스 | `sports.news.naver.com/kbaseball/news/list?type=team&team=LG` | JSON. 헤드라인·URL·날짜만 |
| 로스터 | `koreabaseball.com/Player/Register.aspx` (포스트백 `hfSearchTeam=LG`) | HTML. playerId 추출 |
| 타자 경기별 | `.../HitterDetail/Daily.aspx?playerId=<id>` | HTML. 1B(유도)·2B·3B·HR·BB·HBP·SB·CS 등 |
| 투수 경기별 | `.../PitcherDetail/Daily.aspx?playerId=<id>` | HTML. IP·H·HR·BB·HBP·SO·R·ER·세·홀·선발/구원·TBF |
| 등록/말소 | `koreabaseball.com/Player/RegisterAll.aspx` (당일 위젯) | HTML. 매일 폴링·누적 |

## 가치 모델 (코인 가격 계산)

`pipeline/value_model.py` 가 경기별 박스스코어로 가치(runs)를 계산하고 누적해 코인 가격을 만든다.

- **타자** = wOBA 기반 타격 런(wRAA) + 주루.
- **투수** = 평균 대비 막아낸 실점 + 세이브·홀드 역할 보너스.
- **코인 가격** = 누적 가치 × 스케일 + base 100. 경기별 `open`(경기 전)·`close`(경기 후) 캔들.
- 계산식 전체는 [VALUE_MODEL.md](VALUE_MODEL.md). 리그 상수는 v1 대표값(리그 집계로 보정 여지).

투수 구현 주의: 이닝 분수표기(`5 2/3`)를 5.667로 파싱, 투구수 없음 → TBF로 대용.

## 저장 구조

```
data/
├── roster.json                # LG 선수단 (playerId · 타자/투수 구분)
├── news.json                  # 최근 뉴스 (헤드라인·URL·날짜)
├── moves_history.json         # 등록/말소 누적 이력 (2026-07-12~)
└── players/<playerId>.json     # 선수별 경기별 스탯 + 코인 가격 시계열(open/close)
```

MVP는 읽기 전용·일 배치라 DB 없이 JSON으로 충분하다. 계정·알림이 필요해지면 승격.

## 프론트엔드

`web/` (React). `CandleChart.jsx` 가 코인 시계열을 캔들로 렌더(떡상 빨강/떡락 파랑) + 이동평균선 +
시작가 기준선 + 일·주·월 리샘플 + 툴팁. 홈은 코인 시세판(타자·투수 랭킹).

- **데이터 접근**: 프로덕션은 raw GitHub JSON을 런타임 fetch(재배포 없이 매일 최신), 개발은
  `web/public/data` 심링크로 로컬 데이터를 본다(자동 분기).

## 자동화 (GitHub Actions)

- `.github/workflows/daily.yml` — 매일 08:00 KST(cron `0 23 * * *` UTC) + 수동 실행.
- `run_daily.py` 실행 → 스크랩·가치계산 → `data/` 변경분을 기본 `GITHUB_TOKEN`으로 자동 커밋.

## 견고성 · 법적 고려

- 뉴스는 헤드라인·링크만. rate-limit·robots 존중. 개인/학습용.
- 한 선수/소스 실패해도 전체 배치가 죽지 않게 격리.
- 스크래퍼는 소스별 모듈로 분리(엔드포인트 변경 대비).

## 한계 · 향후

- WPA·경기별 수비·클러치·Statiz(robots 차단)는 데이터 없음 → 가치식에서 제외. 코인 가격은
  **박스스코어 기반 근사**(WAR 아님).
- 리그 상수 자체 산출·역할 보너스 튜닝, 로스터 이동 사유(뉴스+LLM), (선택) 캔들 제스처 줌이 향후 과제.
