// 저장된 시계열은 경기(일) 단위 누적값이다. 주별/월별은 클라이언트에서 리샘플링한다.
// 누적 스탯이므로 각 기간의 "마지막 누적값"이 그 기간 말 상태를 대표한다.

function isoWeekKey(d) {
  // ISO week 기준 (연도-주차). 목요일 기준으로 주차 계산.
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = (date.getUTCDay() + 6) % 7; // 월=0
  date.setUTCDate(date.getUTCDate() - day + 3); // 그 주 목요일
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function keyOf(dateStr, mode) {
  const d = new Date(dateStr + "T00:00:00");
  if (mode === "monthly") return dateStr.slice(0, 7); // YYYY-MM
  if (mode === "weekly") return isoWeekKey(d);
  return dateStr; // daily
}

/**
 * series: [{date, opp, cum_avg, cum_ops}] (날짜 오름차순 가정)
 * mode: 'daily' | 'weekly' | 'monthly'
 * 각 기간의 마지막 항목만 남긴다. daily는 같은 날 중복(더블헤더)만 정리.
 */
export function resample(series, mode) {
  if (!Array.isArray(series)) return [];
  const lastByKey = new Map();
  for (const g of series) {
    lastByKey.set(keyOf(g.date, mode), g); // 뒤에 오는 값이 덮어씀 = 기간 말 값
  }
  return Array.from(lastByKey.values()).sort((a, b) =>
    a.date < b.date ? -1 : 1
  );
}

export const PERIODS = [
  { key: "daily", label: "일별" },
  { key: "weekly", label: "주별" },
  { key: "monthly", label: "월별" },
];

export const METRICS = [
  { key: "cum_avg", label: "타율", digits: 3 },
  { key: "cum_ops", label: "OPS", digits: 3 },
];

/**
 * 코인 캔들 리샘플링. [{date, opp, open, close, value}] (오름차순 가정).
 * 각 기간: open=첫 캔들 open, close=마지막 캔들 close, value=합, 날짜=마지막.
 */
export function resampleCandles(candles, mode) {
  if (!Array.isArray(candles)) return [];
  const groups = new Map();
  for (const c of candles) {
    const k = keyOf(c.date, mode);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(c);
  }
  return Array.from(groups.values())
    .map((g) => ({
      date: g[g.length - 1].date,
      opp: g[g.length - 1].opp,
      open: g[0].open,
      close: g[g.length - 1].close,
      value: g.reduce((s, x) => s + (x.value || 0), 0),
    }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

/** 종가 이동평균(window). */
export function movingAvg(candles, window = 5) {
  return candles.map((_, i) => {
    const seg = candles.slice(Math.max(0, i - window + 1), i + 1);
    const m = seg.reduce((s, x) => s + x.close, 0) / seg.length;
    return Math.round(m * 100) / 100;
  });
}
