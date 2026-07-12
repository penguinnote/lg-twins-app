"""공용 유틸 — HTTP 세션, 경로, JSON 저장, LG 상수.

파이프라인 전 모듈이 공유한다. 엔드포인트/헤더를 한 곳에서 관리해 교체를 쉽게 한다.
"""
from __future__ import annotations
import json
import time
import random
import logging
from pathlib import Path

import requests

# ── 경로 ────────────────────────────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
PLAYERS = DATA / "players"

# ── LG 트윈스 상수 ──────────────────────────────────────────────────────
TEAM_CODE = "LG"          # 네이버 뉴스 team 파라미터 & KBO hfSearchTeam
TEAM_NAME = "LG"          # KBO '당일 등록/말소' 표의 팀 컬럼 매칭용

# ── HTTP ────────────────────────────────────────────────────────────────
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/124.0 Safari/537.36")

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(name)s | %(message)s")
log = logging.getLogger("pipeline")


def make_session(referer: str | None = None) -> requests.Session:
    s = requests.Session()
    s.headers.update({"User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9"})
    if referer:
        s.headers["Referer"] = referer
    return s


def polite_sleep(lo: float = 1.0, hi: float = 2.0) -> None:
    """요청 사이 예의상 대기(서버 부담 방지)."""
    time.sleep(random.uniform(lo, hi))


# ── JSON 입출력 ─────────────────────────────────────────────────────────
def load_json(path: Path, default):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return default
    except Exception as e:  # 손상 파일도 파이프라인을 죽이지 않는다
        log.warning("load_json 실패 %s: %s → 기본값 사용", path, e)
        return default


def save_json(path: Path, obj) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n",
                    encoding="utf-8")
    log.info("saved %s", path.relative_to(ROOT))
