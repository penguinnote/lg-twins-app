import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../hooks/useFetch";
import { Container } from "../components/Container";
import { CandleChart } from "../components/CandleChart";
import { StatChart } from "../components/StatChart";
import { StatusCard } from "../components/StatusCard";
import { FollowButton } from "../components/FollowButton";
import { Loading, ErrorState, Empty } from "../components/States";

export default function Players() {
  const roster = useFetch((o) => api.roster(o), []);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("id");

  const players = roster.data?.players || [];
  const current = players.find((p) => p.playerId === selectedId) || players.filter((p) => !p.is_pitcher)[0] || null;

  const [tab, setTab] = useState(null); // 'bat' | 'pit' | null(=현재 선수 따라감)
  const activeTab = tab ?? (current?.is_pitcher ? "pit" : "bat");
  const list = players.filter((p) => (activeTab === "pit" ? p.is_pitcher : !p.is_pitcher));

  const select = (id) => setParams(id ? { id } : {}, { replace: true });
  const switchTab = (t) => {
    setTab(t);
    const first = players.find((p) => (t === "pit" ? p.is_pitcher : !p.is_pitcher));
    if (first) select(first.playerId);
  };

  return (
    <section className="min-h-full w-full bg-gray-50 py-5 md:py-9">
      <Container>
        <h1 className="mb-1 text-xl font-black text-lg-ink md:text-2xl">🪙 트윈스 코인</h1>
        <p className="mb-3 text-xs text-gray-400 md:mb-5 md:text-sm">
          경기 기여도(runs)를 코인 시세처럼. 선발·타자 등락 텍스처가 다릅니다.
        </p>

        {roster.loading && <Loading />}
        {roster.error && <ErrorState message={roster.error} onRetry={() => location.reload()} />}

        {roster.data && (
          <>
            {/* 타자 / 투수 필터 */}
            <div className="mb-3 inline-flex rounded-full bg-gray-200 p-0.5">
              {[
                ["bat", "타자"],
                ["pit", "투수"],
              ].map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => switchTab(k)}
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    activeTab === k ? "bg-white text-lg-red shadow-sm" : "text-gray-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 선수 선택 칩 */}
            <div className="-mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:mb-6 md:flex-wrap md:overflow-visible md:px-0">
              {list.map((p) => (
                <button
                  key={p.playerId}
                  onClick={() => select(p.playerId)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                    current?.playerId === p.playerId
                      ? "border-lg-red bg-lg-red text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-lg-red hover:text-lg-red"
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {current ? (
              <PlayerPanel player={current} />
            ) : (
              <Empty label="선수 정보가 없습니다." />
            )}
          </>
        )}
      </Container>
    </section>
  );
}

function PlayerPanel({ player }) {
  const { loading, error, data } = useFetch(
    (o) => api.player(player.playerId, o),
    [player.playerId]
  );
  const [mode, setMode] = useState("coin"); // 'coin' | 'status' | 'stat'
  const isHitter = !player.is_pitcher;
  const modes = isHitter
    ? [["coin", "코인"], ["status", "상태창"], ["stat", "타율·OPS"]]
    : [["coin", "코인"], ["status", "상태창"]];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-8">
      <div className="mb-3 flex items-start justify-between gap-2 md:mb-5">
        <div>
          <h2 className="text-lg font-extrabold text-lg-ink md:text-2xl">{player.name}</h2>
          <p className="text-xs text-gray-400 md:text-sm">
            <span className={player.is_pitcher ? "text-blue-500" : "text-lg-red"}>
              {player.is_pitcher ? "투수" : "타자"}
            </span>{" "}
            · LG 트윈스 {data ? `· ${data.season} ${data.games}경기` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <FollowButton playerId={player.playerId} />
          <div className="inline-flex rounded-full bg-gray-100 p-0.5">
            {modes.map(([k, label]) => (
              <button
                key={k}
                onClick={() => setMode(k)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  mode === k ? "bg-lg-red text-white" : "text-gray-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <Loading label="불러오는 중…" />}
      {error && <ErrorState message={error} />}
      {data && mode === "status" && (
        <StatusCard player={player} ratings={data.ratings} />
      )}
      {data && mode === "stat" && (
        data.series?.length ? <StatChart series={data.series} /> : <Empty label="기록 없음" />
      )}
      {data && mode === "coin" && (
        data.coin?.candles?.length ? (
          <CandleChart candles={data.coin.candles} base={data.coin.base} />
        ) : (
          <Empty label="아직 경기 기록이 없습니다." />
        )
      )}

      {/* 코인/타율 뷰의 투명성 고지(상태창은 자체 고지) */}
      {mode !== "status" && (
        <p className="mt-4 text-[11px] leading-relaxed text-gray-400">
          ※ 박스스코어 기반 <b>타격·투구 기여 지수</b>입니다(WAR 아님). 수비·주루(SB/CS 외)·클러치·
          레버리지는 KBO 공개데이터에 없어 제외했습니다. 단일 경기는 표본이 작아 추세(이동평균)로 보세요.
        </p>
      )}
    </div>
  );
}
