// 데이터 접근 — 파이프라인이 매일 커밋하는 raw GitHub JSON을 런타임에 읽는다(재배포 불필요).
// 프론트는 읽기 전용. 뉴스 본문은 저장하지 않으므로 항상 원문 링크로만 보낸다.

export const BASE =
  "https://raw.githubusercontent.com/penguinnote/lg-twins-app/main/data";

/**
 * JSON 하나를 fetch. 실패 시 명확한 Error를 던져 호출부(useFetch)가 에러 상태로 처리.
 */
export async function fetchJson(path, { signal } = {}) {
  const url = `${BASE}/${path}`;
  let res;
  try {
    res = await fetch(url, { signal, cache: "no-store" });
  } catch (e) {
    if (e.name === "AbortError") throw e;
    throw new Error("네트워크 연결을 확인해 주세요.");
  }
  if (!res.ok) {
    throw new Error(`데이터를 불러오지 못했습니다 (${res.status})`);
  }
  return res.json();
}

export const api = {
  news: (opts) => fetchJson("news.json", opts),
  roster: (opts) => fetchJson("roster.json", opts),
  player: (playerId, opts) => fetchJson(`players/${playerId}.json`, opts),
};
