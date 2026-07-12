// 표시용 포맷 유틸.

// 0.298 -> ".298" (야구 관습: 앞자리 0 생략). 1.014 -> "1.014".
export function avgFmt(v) {
  if (v == null || Number.isNaN(v)) return "-";
  const s = Number(v).toFixed(3);
  return s.startsWith("0.") ? s.slice(1) : s;
}

// "2026.07.11 19:11" 또는 "2026-07-11" -> "07.11"
export function shortDate(s) {
  if (!s) return "";
  const m = String(s).match(/(\d{4})[.\-](\d{2})[.\-](\d{2})/);
  return m ? `${m[2]}.${m[3]}` : s;
}
