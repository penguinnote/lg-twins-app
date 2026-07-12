import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../hooks/useFetch";
import { NewsCard } from "../components/NewsCard";
import { Sparkline } from "../components/Sparkline";
import { Loading, ErrorState, Empty } from "../components/States";
import { avgFmt } from "../lib/format";

// 홈 주목 선수(없으면 로스터 첫 타자로 폴백)
const FEATURED_ID = "53123"; // 오스틴

export default function Home() {
  const news = useFetch((o) => api.news(o), []);
  const roster = useFetch((o) => api.roster(o), []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-lg-ink">주목 선수</h2>
          <Link to="/players" className="text-xs font-semibold text-lg-red">
            전체 선수 →
          </Link>
        </div>
        {roster.loading && <Loading />}
        {roster.error && <ErrorState message={roster.error} />}
        {roster.data && <FeaturedCard roster={roster.data} />}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-bold text-lg-ink">최신 뉴스</h2>
          <Link to="/news" className="text-xs font-semibold text-lg-red">
            더보기 →
          </Link>
        </div>
        {news.loading && <Loading />}
        {news.error && <ErrorState message={news.error} />}
        {news.data && (
          news.data.items?.length ? (
            <div className="flex flex-col gap-2">
              {news.data.items.slice(0, 4).map((it) => (
                <NewsCard key={`${it.oid}-${it.aid}`} item={it} />
              ))}
            </div>
          ) : (
            <Empty label="뉴스가 아직 없습니다." />
          )
        )}
      </section>
    </div>
  );
}

function FeaturedCard({ roster }) {
  const hitters = (roster.players || []).filter((p) => !p.is_pitcher);
  const featured =
    hitters.find((p) => p.playerId === FEATURED_ID) || hitters[0];
  const player = useFetch(
    (o) => api.player(featured.playerId, o),
    [featured?.playerId]
  );

  if (!featured) return <Empty label="선수 정보가 없습니다." />;

  return (
    <Link
      to={`/players?id=${featured.playerId}`}
      className="block rounded-2xl border border-gray-100 bg-white p-4 active:bg-lg-soft"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-extrabold text-lg-ink">{featured.name}</p>
          <p className="text-xs text-gray-400">{featured.position} · LG 트윈스</p>
        </div>
        {player.data && (
          <div className="flex gap-4 text-right">
            <Stat label="타율" value={avgFmt(lastVal(player.data, "cum_avg"))} />
            <Stat label="OPS" value={avgFmt(lastVal(player.data, "cum_ops"))} />
          </div>
        )}
      </div>
      <div className="mt-3">
        {player.loading && <div className="h-14" />}
        {player.error && <p className="py-4 text-center text-xs text-gray-400">스탯을 불러오지 못했습니다.</p>}
        {player.data?.series?.length ? (
          <Sparkline series={player.data.series} dataKey="cum_avg" />
        ) : null}
      </div>
      <p className="mt-1 text-center text-[11px] font-medium text-lg-red">
        타율 시계열 자세히 보기 →
      </p>
    </Link>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="text-base font-black text-lg-ink">{value}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  );
}

function lastVal(data, key) {
  const s = data.series || [];
  return s.length ? s[s.length - 1][key] : null;
}
