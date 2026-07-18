import { useMemo, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { resampleCandles, movingAvg, PERIODS } from "../lib/resample";
import { shortDate } from "../lib/format";

const UP = "#C4012F"; // 상승(빨강)
const DOWN = "#2563EB"; // 하락(파랑)
const ABSENT = "#cbd5e1"; // 결장(회색 짝대기)

// 선수 캔들을 팀 경기 마스터 축에 정렬 — 안 뛴 날은 직전 종가로 유지되는 회색 짝대기.
function alignToMaster(candles, masterDates, base) {
  const byDate = new Map(candles.map((c) => [c.date, c]));
  let last = base;
  return masterDates.map((d) => {
    const c = byDate.get(d);
    if (c) {
      last = c.close;
      return { ...c, absent: false };
    }
    return { date: d, opp: "", open: last, close: last, value: 0, absent: true };
  });
}

// 트윈스 코인 캔들차트. masterDates가 있으면 팀 경기축에 정렬(봉 개수 통일).
// compact=true → 축·격자·토글 없이 캔들+이동평균선만, 최근 windowN경기만(홈 썸네일).
export function CandleChart({ candles, base = 100, masterDates, compact = false, windowN = 20 }) {
  const [period, setPeriod] = useState("daily");

  const data = useMemo(() => {
    const aligned = masterDates?.length
      ? alignToMaster(candles, masterDates, base)
      : candles.map((c) => ({ ...c, absent: false }));
    const usePeriod = compact ? "daily" : period;
    const rs =
      usePeriod === "daily"
        ? aligned
        : resampleCandles(aligned, usePeriod).map((c) => ({ ...c, absent: false }));
    const ma = movingAvg(rs, 5);
    let arr = rs.map((c, i) => ({
      ...c,
      body: [Math.min(c.open, c.close), Math.max(c.open, c.close)],
      up: c.close >= c.open,
      ma: ma[i],
      absent: c.absent || false,
    }));
    if (compact) arr = arr.slice(-(windowN || 20));
    return arr;
  }, [candles, masterDates, base, period, compact, windowN]);

  if (!data.length) return null;

  const lows = data.map((d) => d.body[0]);
  const highs = data.map((d) => d.body[1]);
  const min = Math.min(...lows, base);
  const max = Math.max(...highs);
  const pad = (max - min) * 0.08 || 5;

  const latest = data[data.length - 1];
  const totalDelta = latest.close - base;

  // 컴팩트 썸네일 — 캔들 + 이동평균선만.
  if (compact) {
    return (
      <div className="h-[116px] w-full md:h-[140px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
            <YAxis domain={[min - pad, max + pad]} hide />
            <XAxis dataKey="date" hide />
            <Bar dataKey="body" shape={<Candle />} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="ma"
              stroke="#f59e0b"
              strokeWidth={1.2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="whitespace-nowrap text-2xl font-black text-lg-ink">
            {latest.close.toFixed(1)}
          </span>
          <span className="text-xs text-gray-400">코인가 · 현재</span>
          <span
            className={`whitespace-nowrap text-xs font-bold ${totalDelta >= 0 ? "text-lg-red" : "text-blue-600"}`}
          >
            {totalDelta >= 0 ? "▲" : "▼"} {Math.abs(totalDelta).toFixed(1)} ({base} 시작)
          </span>
        </div>
        <div className="shrink-0">
          <Toggle options={PERIODS} value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="h-64 w-full md:h-[440px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 6, left: -6, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              minTickGap={24}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              width={40}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v.toFixed(0)}
            />
            <ReferenceLine y={base} stroke="#d1d5db" strokeDasharray="4 4" />
            <Tooltip content={<CandleTip />} />
            <Bar dataKey="body" shape={<Candle />} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="ma"
              stroke="#f59e0b"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-400">
        빨강=상승 · 파랑=하락 · 회색=결장 · 주황선=이동평균 · 점선=시작가({base}) · {data.length}칸
      </p>
    </div>
  );
}

function Candle({ x, y, width, height, payload }) {
  const w = Math.max(2, Math.min(width * 0.7, 16));
  const cx = x + (width - w) / 2;
  const h = Math.max(height, 2); // 도지·결장 최소 두께
  const fill = payload.absent ? ABSENT : payload.up ? UP : DOWN;
  return <rect x={cx} y={y} width={w} height={h} rx={1} fill={fill} />;
}

function Toggle({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-gray-100 p-0.5">
      {options.map((o) => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            value === o.key ? "bg-lg-red text-white shadow-sm" : "text-gray-500"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function CandleTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null;
  const d = payload[0].payload;
  const up = d.close >= d.open;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-lg-ink">{d.date}</p>
      {d.absent ? (
        <p className="text-gray-400">결장</p>
      ) : (
        <>
          {d.opp && <p className="text-gray-400">vs {d.opp}</p>}
          <p className="mt-0.5 text-gray-500">
            {d.open.toFixed(1)} → <span className="font-bold text-lg-ink">{d.close.toFixed(1)}</span>
          </p>
          <p className={`font-bold ${up ? "text-lg-red" : "text-blue-600"}`}>
            {up ? "▲" : "▼"} {Math.abs(d.close - d.open).toFixed(1)}
          </p>
        </>
      )}
    </div>
  );
}
