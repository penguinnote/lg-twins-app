# LG 트윈스 팬 웹사이트

> LG 트윈스 팬을 위한 웹사이트 — 우리 팀 뉴스·로스터 이동·선수 스탯 시계열을 한 곳에서.
> (KBO / 데이터 파이프라인 + React)

_이 README는 스텁입니다. 본문은 작성 예정._

## Phase 0 — 데이터 파이프라인 (구현 완료)

매일 GitHub Actions가 LG 트윈스 데이터를 수집해 `data/`에 JSON으로 커밋한다.
파이프라인 소스·파일 구조·스케줄은 [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 참고.

```bash
python -m venv .venv && ./.venv/bin/pip install -r requirements.txt
python -m pipeline.run_daily      # 로컬 1회 수집
```
