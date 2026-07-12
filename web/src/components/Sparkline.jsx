import { AreaChart, Area, YAxis, ResponsiveContainer } from "recharts";

// 홈 미리보기용 미니 차트 (축·툴팁 없음).
export function Sparkline({ series, dataKey = "cum_avg" }) {
  const values = series.map((d) => d[dataKey]).filter((v) => v != null);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = (max - min) * 0.2 || 0.02;
  return (
    <div className="h-14 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C4012F" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#C4012F" stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[Math.max(0, min - pad), max + pad]} />
          <Area
            type="monotone"
            dataKey={dataKey}
            stroke="#C4012F"
            strokeWidth={2}
            fill="url(#spark)"
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
