import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../hooks/useFetch";
import { StatChart } from "../components/StatChart";
import { Loading, ErrorState, Empty } from "../components/States";
import { avgFmt } from "../lib/format";

export default function Players() {
  const roster = useFetch((o) => api.roster(o), []);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("id");

  const hitters = (roster.data?.players || []).filter((p) => !p.is_pitcher);
  const current =
    hitters.find((p) => p.playerId === selectedId) || hitters[0] || null;

  const select = (id) => setParams(id ? { id } : {}, { replace: true });

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="mb-3 text-xl font-black text-lg-ink">선수 스탯</h1>

      {roster.loading && <Loading />}
      {roster.error && <ErrorState message={roster.error} onRetry={() => location.reload()} />}

      {roster.data && (
        <>
          {/* 타자 선택 칩 */}
          <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {hitters.map((p) => (
              <button
                key={p.playerId}
                onClick={() => select(p.playerId)}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  current?.playerId === p.playerId
                    ? "border-lg-red bg-lg-red text-white"
                    : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          {current ? (
            <PlayerPanel player={current} />
          ) : (
            <Empty label="타자 정보가 없습니다." />
          )}
        </>
      )}
    </div>
  );
}

function PlayerPanel({ player }) {
  const { loading, error, data } = useFetch(
    (o) => api.player(player.playerId, o),
    [player.playerId]
  );

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-lg-ink">{player.name}</h2>
          <p className="text-xs text-gray-400">{player.position} · LG 트윈스</p>
        </div>
        {data && (
          <p className="text-xs text-gray-400">
            {data.season} 시즌 · {data.games}경기
          </p>
        )}
      </div>

      {loading && <Loading label="스탯 불러오는 중…" />}
      {error && <ErrorState message={error} />}
      {data &&
        (data.series?.length ? (
          <StatChart series={data.series} />
        ) : (
          <Empty label="아직 경기 기록이 없습니다." />
        ))}
    </div>
  );
}
