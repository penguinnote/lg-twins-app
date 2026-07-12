import { useEffect, useState } from "react";

/**
 * 데이터 fetch 훅 — loading/error/data를 일관되게 처리.
 * fn: (opts) => Promise, deps로 재요청. 언마운트/deps 변경 시 abort.
 */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });

  useEffect(() => {
    const ctrl = new AbortController();
    setState({ loading: true, error: null, data: null });
    fn({ signal: ctrl.signal })
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((e) => {
        if (e.name === "AbortError") return;
        setState({ loading: false, error: e.message || "오류가 발생했습니다.", data: null });
      });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}
