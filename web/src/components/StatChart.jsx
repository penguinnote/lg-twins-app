import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  CartesianGrid,
} from "recharts";
import { resample, PERIODS, METRICS } from "../lib/resample";
import { avgFmt, shortDate } from "../lib/format";

// "주식 차트" 스탯 시각화 — 타율/OPS를 시간 축 영역 차트로.
export function StatChart({ series }) {
  const [metric, setMetric] = useState("cum_avg");
  const [period, setPeriod] = useState("daily");

  const data = useMemo(() => resample(series, period), [series, period]);
  const meta = METRICS.find((m) => m.key === metric);

  const values = data.map((d) => d[metric]).filter((v) => v != null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.15 || 0.02;
  const domain = [Math.max(0, min - pad), max + pad];
  const baseline = values[0]; // 시즌 초 기준선 — 지금이 그때보다 나은가

  const latest = values[values.length - 1];
  const delta = latest != null && baseline != null ? latest - baseline : 0;

  return (
    <div>
      {/* 지표 · 기간 토글 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <Toggle options={METRICS} value={metric} onChange={setMetric} />
        <Toggle options={PERIODS} value={period} onChange={setPeriod} />
      </div>

      {/* 현재값 + 시즌 초 대비 */}
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-2xl font-black text-lg-ink">{avgFmt(latest)}</span>
        <span className="text-xs text-gray-400">{meta.label} · 현재 누적</span>
        {Number.isFinite(delta) && Math.abs(delta) >= 0.0005 && (
          <span
            className={`ml-auto text-xs font-semibold ${
              delta >= 0 ? "text-lg-red" : "text-blue-500"
            }`}
          >
            {delta >= 0 ? "▲" : "▼"} {avgFmt(Math.abs(delta))} vs 시즌 초
          </span>
        )}
      </div>

      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 6, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C4012F" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#C4012F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
            <XAxis
              dataKey="date"
              tickFormatter={shortDate}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              minTickGap={24}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={domain}
              tickFormatter={avgFmt}
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              width={38}
              axisLine={false}
              tickLine={false}
            />
            {baseline != null && (
              <ReferenceLine y={baseline} stroke="#d1d5db" strokeDasharray="4 4" />
            )}
            <Tooltip content={<ChartTooltip metric={metric} label={meta.label} />} />
            <Area
              type="monotone"
              dataKey={metric}
              stroke="#C4012F"
              strokeWidth={2}
              fill="url(#fill)"
              dot={false}
              activeDot={{ r: 4, fill: "#C4012F" }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-[11px] text-gray-400">
        점선 = 시즌 초 기준선 · {data.length}개 지점 ({PERIODS.find((p) => p.key === period).label})
      </p>
    </div>
  );
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

function ChartTooltip({ active, payload, metric, label }) {
  if (!active || !payload || !payload.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-100 bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-semibold text-lg-ink">{row.date}</p>
      {row.opp && <p className="text-gray-400">vs {row.opp}</p>}
      <p className="mt-0.5 text-lg-red">
        {label} <span className="font-bold">{avgFmt(row[metric])}</span>
      </p>
    </div>
  );
}
