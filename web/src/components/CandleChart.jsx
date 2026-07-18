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

const UP = "#C4012F"; // 떡상(빨강)
const DOWN = "#2563EB"; // 떡락(파랑)

// 트윈스 코인 캔들차트 — 경기별 가치 등락을 코인 시세처럼.
// compact=true → 축·격자·토글·헤더 없이 캔들 + 이동평균선만(홈 썸네일용).
export function CandleChart({ candles, base = 100, compact = false }) {
  const [period, setPeriod] = useState("daily");

  const data = useMemo(() => {
    const rs = resampleCandles(candles, compact ? "daily" : period);
    const ma = movingAvg(rs, 5);
    return rs.map((c, i) => ({
      ...c,
      body: [Math.min(c.open, c.close), Math.max(c.open, c.close)], // 범위 바(플로팅)
      up: c.close >= c.open,
      ma: ma[i],
    }));
  }, [candles, period, compact]);

  if (!data.length) return null;

  const lows = data.map((d) => d.body[0]);
  const highs = data.map((d) => d.body[1]);
  const min = Math.min(...lows, base);
  const max = Math.max(...highs);
  const pad = (max - min) * 0.08 || 5;

  const latest = data[data.length - 1];
  const totalDelta = latest.close - base;

  // 컴팩트 썸네일 — 캔들 몸통 + MA선만.
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
            <Tooltip content={<CandleTip base={base} />} />
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
        빨강=떡상 · 파랑=떡락 · 주황선=이동평균(5) · 점선=시작가({base}) · {data.length}캔들
      </p>
    </div>
  );
}

function Candle({ x, y, width, height, payload }) {
  const fill = payload.up ? UP : DOWN;
  const w = Math.max(2, Math.min(width * 0.7, 16));
  const cx = x + (width - w) / 2;
  const h = Math.max(height, 2); // 도지(가치 0) 최소 두께
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
      {d.opp && <p className="text-gray-400">vs {d.opp}</p>}
      <p className="mt-0.5 text-gray-500">
        {d.open.toFixed(1)} → <span className="font-bold text-lg-ink">{d.close.toFixed(1)}</span>
      </p>
      <p className={`font-bold ${up ? "text-lg-red" : "text-blue-600"}`}>
        {up ? "▲ 떡상" : "▼ 떡락"} {Math.abs(d.close - d.open).toFixed(1)} (가치 {d.value >= 0 ? "+" : ""}
        {d.value.toFixed(2)})
      </p>
    </div>
  );
}
