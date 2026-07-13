"""일일 러너 — 뉴스·등록/말소·선수 시계열을 순서대로 수집한다.

견고성 원칙:
  - 한 소스/한 선수가 실패해도 전체가 죽지 않도록 각 단계를 try/except로 격리.
  - 요청 사이 예의상 sleep(common.polite_sleep).
  - 실패는 로그로 남기고, 마지막에 요약 + 실패 시 exit code 1.

실행: python -m pipeline.run_daily   (레포 루트에서)
"""
from __future__ import annotations
import sys

from .common import polite_sleep, load_json, log, DATA
from . import roster, news, moves, timeseries, pitcher


def main() -> int:
    failures: list[str] = []

    # 1) 로스터 (시계열이 여기에 의존하므로 먼저)
    players = []
    try:
        players = roster.update_roster()
    except Exception as e:
        log.exception("roster 실패: %s", e)
        failures.append("roster")
        # 로스터 갱신 실패 시 기존 roster.json으로 시계열이라도 시도
        players = load_json(DATA / "roster.json", {}).get("players", [])

    # 2) 뉴스
    try:
        news.update_news()
    except Exception as e:
        log.exception("news 실패: %s", e)
        failures.append("news")
    polite_sleep()

    # 3) 등록/말소 이력 (오늘부터 축적 — 소급 불가라 최우선 신뢰성)
    try:
        moves.append_moves()
    except Exception as e:
        log.exception("moves 실패: %s", e)
        failures.append("moves")
    polite_sleep()

    # 4) 타자 시계열 + 트윈스 코인 (선수별 격리)
    hitters = [p for p in players if not p.get("is_pitcher")]
    ok = 0
    for p in hitters:
        pid = p["playerId"]
        try:
            data = timeseries.update_player(pid)
            ok += 1
            log.info("  타자 %s(%s): %d경기", p.get("name"), pid, data["games"])
        except Exception as e:
            log.warning("  타자 실패 %s(%s): %s", p.get("name"), pid, e)
            failures.append(f"player:{pid}")
        polite_sleep()
    log.info("타자: %d/%d 성공", ok, len(hitters))

    # 5) 투수 게임로그 + 트윈스 코인 (선수별 격리)
    pitchers = [p for p in players if p.get("is_pitcher")]
    okp = 0
    for p in pitchers:
        pid = p["playerId"]
        try:
            data = pitcher.update_pitcher(pid)
            okp += 1
            log.info("  투수 %s(%s): %d등판", p.get("name"), pid, data["games"])
        except Exception as e:
            log.warning("  투수 실패 %s(%s): %s", p.get("name"), pid, e)
            failures.append(f"player:{pid}")
        polite_sleep()
    log.info("투수: %d/%d 성공", okp, len(pitchers))

    if failures:
        log.warning("완료 (일부 실패: %s)", ", ".join(failures))
        # 선수 개별 실패는 치명적이지 않게 — 소스 전체 실패만 비정상 종료
        source_fail = [f for f in failures if not f.startswith("player:")]
        return 1 if source_fail else 0
    log.info("모든 단계 성공")
    return 0


if __name__ == "__main__":
    sys.exit(main())
