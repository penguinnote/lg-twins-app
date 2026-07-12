# LG 트윈스 팬 웹사이트 (working title)

> LG 트윈스 팬을 위한 웹사이트 — **우리 팀 뉴스 · 로스터 이동 · 선수 스탯 시계열**을 한 곳에서.
> 네이버 스포츠가 안 하는 것: 원팀 몰입 + "주식 차트처럼" 보는 선수 성적 흐름.

<p>
  <img alt="React" src="https://img.shields.io/badge/React-web-61DAFB?logo=react&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-pipeline-3776AB?logo=python&logoColor=white">
  <img alt="GitHub Actions" src="https://img.shields.io/badge/GitHub%20Actions-daily-2088FF?logo=githubactions&logoColor=white">
  <img alt="status" src="https://img.shields.io/badge/status-WIP-orange">
</p>

🔗 **Live demo:** _Phase 1에서 추가 예정_
📄 **문서:** [기획](docs/PLANNING.md) · [디자인](docs/DESIGN.md) · [아키텍처](docs/ARCHITECTURE.md)

---

## 왜 만드나

네이버 스포츠는 모든 팀·모든 스탯을 나열하는 **종합 백과사전**이다. 한 팀 팬에겐 (1) 우리 팀
뉴스만 보기 귀찮고, (2) 로스터 이동을 한눈에 못 보고, (3) 선수가 어떻게 성장·부진했는지의
**시간 축**이 없다.

이 프로젝트는 네이버와 포괄성으로 경쟁하지 않는다. **한 팀(LG 트윈스) 팬을 위한 깊이·정체성·해석**으로
차별화한다.

## 주요 기능

- **우리 팀 뉴스 피드** — LG 뉴스만 모아 헤드라인·날짜로, 탭하면 원문으로.
- **로스터 이동 트래커** — 등록/말소·콜업·트레이드 리스트에 사유 한 줄.
- **선수 스탯 시계열 그래프 (핵심)** — 타율/OPS를 주식 차트처럼. 일별/주별/월별 전환으로
  성장·전성기·슬럼프를 시각화. (네이버는 '현재 스탯'만 보여준다)

## 스크린샷

_Phase 1(웹사이트)에서 추가 예정._

## 아키텍처 (요약)

KBO는 공개 API가 없어, **매일 도는 데이터 파이프라인**이 뉴스·로스터 이동·선수 시계열을 수집해
JSON으로 떨구고 웹사이트가 이를 읽는다. GitHub Actions로 매일 자동 수집한다. 상세: [ARCHITECTURE](docs/ARCHITECTURE.md).

```
[GitHub Actions 매일] → pipeline/ 스크래퍼 → data/ JSON → [웹사이트(React)]
```

## 기술 스택

| 구분 | 기술 |
|---|---|
| 데이터 파이프라인 | Python (requests, BeautifulSoup, pandas) |
| 자동화 | GitHub Actions (cron) |
| 저장 | JSON (MVP) |
| 프론트 | React (Phase 1) |

## 프로젝트 구조

```
├── pipeline/   # 수집 스크립트 (roster·news·moves·timeseries·run_daily)
├── data/       # 산출 JSON (매일 자동 커밋)
├── docs/       # 기획·디자인·아키텍처
├── spike/      # 데이터 실현가능성 검증(스파이크) 기록
└── .github/workflows/daily.yml
```

## 로드맵

- [x] **Phase 0** — 데이터 파이프라인 + 매일 자동 수집. 로스터 이동 이력 축적 시작.
- [ ] **Phase 1 (MVP)** — 뉴스 + 시계열 그래프 웹사이트. 친구들에게 배포해 검증.
- [ ] **Phase 2** — 로스터 이동 탭 + LLM 사유 생성.
- [ ] **Phase 3** — (선택) 승부 예측 모델, 알림.

## 데이터 출처 · 고지

데이터는 네이버 스포츠·KBO 공식에서 수집하며, 뉴스는 **헤드라인과 원문 링크만** 다루고 본문은
저장하지 않는다. 개인·학습용 프로젝트다.
