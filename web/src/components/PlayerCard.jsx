import { Link } from "react-router-dom";
import { Sparkline } from "./Sparkline";

// 홈 "코인 시세판" 미니 카드 — 코인가격 + 최근 등락 + 미니 시세선.
export function PlayerCard({ player, data }) {
  const candles = data?.coin?.candles || [];
  const last = candles.length ? candles[candles.length - 1] : null;
  const price = last ? last.close : null;
  const move = last ? last.close - last.open : 0; // 최근 경기 등락
  const up = move >= 0;

  return (
    <Link
      to={`/players?id=${player.playerId}`}
      className="flex flex-col rounded-2xl border border-gray-100 bg-white p-3.5 active:bg-lg-soft md:p-4 md:transition-shadow md:hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold text-lg-ink">{player.name}</p>
          <p className="text-[11px] text-gray-400">
            <span className={player.is_pitcher ? "text-blue-500" : "text-lg-red"}>
              {player.is_pitcher ? "투" : "타"}
            </span>{" "}
            {player.position}
          </p>
        </div>
        <div className="text-right leading-none">
          <p className="text-lg font-black text-lg-ink">{price != null ? price.toFixed(1) : "-"}</p>
          <p className={`mt-0.5 text-[10px] font-bold ${up ? "text-lg-red" : "text-blue-600"}`}>
            {last ? `${up ? "▲" : "▼"} ${Math.abs(move).toFixed(1)}` : "코인"}
          </p>
        </div>
      </div>

      <div className="mt-2 h-12 md:h-16">
        {candles.length ? (
          <Sparkline series={candles} dataKey="close" />
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-gray-300">
            기록 없음
          </div>
        )}
      </div>
    </Link>
  );
}

export function PlayerCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3.5 md:p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <div className="h-3.5 w-16 rounded bg-gray-100" />
          <div className="h-2.5 w-10 rounded bg-gray-100" />
        </div>
        <div className="h-4 w-10 rounded bg-gray-100" />
      </div>
      <div className="mt-3 h-12 animate-pulse rounded bg-gray-50 md:h-16" />
    </div>
  );
}
