// 육각 레이더(데이터 구동). pointy-top, 6축 위(0°)부터 시계방향 60°.
// 정점 = center + (rating/100 × R)·(sinθ, -cosθ).
const CX = 150;
const CY = 150;
const R = 96;
const RED = "#E4002B";

const ang = (i) => (i * 60 * Math.PI) / 180;
const pt = (i, radius) => [CX + radius * Math.sin(ang(i)), CY - radius * Math.cos(ang(i))];
const poly = (pts) => pts.map((p) => p.join(",")).join(" ");

export function HexRadar({ axes, dim = false }) {
  const n = axes.length; // 6
  const gridLevels = [0.25, 0.5, 0.75, 1];
  const dataPts = axes.map((a, i) => pt(i, (R * Math.max(0, Math.min(100, a.rating))) / 100));

  return (
    <svg viewBox="0 0 300 300" className="w-full" role="img" aria-label="능력치 레이더">
      {/* 배경 동심 육각 격자 */}
      {gridLevels.map((lv, k) => (
        <polygon
          key={k}
          points={poly(Array.from({ length: n }, (_, i) => pt(i, R * lv)))}
          fill="none"
          stroke="#ffffff"
          strokeOpacity={k === gridLevels.length - 1 ? 0.28 : 0.12}
          strokeWidth="1"
        />
      ))}
      {/* 축 스포크 */}
      {Array.from({ length: n }, (_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" />;
      })}

      {/* 데이터 폴리곤 */}
      <polygon
        points={poly(dataPts)}
        fill={RED}
        fillOpacity={dim ? 0.12 : 0.32}
        stroke={RED}
        strokeOpacity={dim ? 0.5 : 1}
        strokeWidth="2"
      />
      {dataPts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3" fill="#fff" stroke={RED} strokeWidth="1.5" opacity={dim ? 0.5 : 1} />
      ))}

      {/* 축 라벨 + rating */}
      {axes.map((a, i) => {
        const [lx, ly] = pt(i, R + 22);
        const anchor = Math.abs(lx - CX) < 6 ? "middle" : lx > CX ? "start" : "end";
        return (
          <g key={i}>
            <text x={lx} y={ly - 4} textAnchor={anchor} fontSize="12" fill="#c9ccd3" fontWeight="600">
              {a.label}
            </text>
            <text x={lx} y={ly + 11} textAnchor={anchor} fontSize="13" fill="#ffffff" fontWeight="800">
              {a.rating}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
