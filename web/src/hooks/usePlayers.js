import { useEffect, useState } from "react";
import { api } from "../lib/api";

/**
 * 여러 선수 시계열을 병렬 fetch. Promise.allSettled로 개별 실패를 격리한다
 * (한 선수 파일이 실패해도 나머지는 정상 표시). 파일이 작아 성능 부담 없음.
 * @returns {{loading:boolean, results:Array<{player, data}>}} 성공한 것만 results에 담김
 */
export function usePlayers(hitters) {
  const [state, setState] = useState({ loading: true, results: [] });
  const ids = hitters.map((h) => h.playerId).join(",");

  useEffect(() => {
    if (!hitters.length) {
      setState({ loading: false, results: [] });
      return;
    }
    const ctrl = new AbortController();
    setState({ loading: true, results: [] });

    Promise.allSettled(
      hitters.map((h) =>
        api.player(h.playerId, { signal: ctrl.signal }).then((data) => ({ player: h, data }))
      )
    ).then((settled) => {
      if (ctrl.signal.aborted) return;
      const results = settled
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
      setState({ loading: false, results });
    });

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return state;
}
