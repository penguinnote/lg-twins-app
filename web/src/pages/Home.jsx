import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../hooks/useFetch";
import { usePlayers } from "../hooks/usePlayers";
import { Container } from "../components/Container";
import { NewsCard } from "../components/NewsCard";
import { PlayerCard, PlayerCardSkeleton } from "../components/PlayerCard";
import { Loading, ErrorState, Empty } from "../components/States";

const TOP_N = 12; // 홈에 노출할 주요 타자 수(4열 그리드 3줄)
const MIN_GAMES = 40; // 소표본(대타·백업) 제외 기준

// 선수 카드: 모바일 2열 → lg 3열 → xl 4열
const CARD_GRID = "grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4";

export default function Home() {
  const roster = useFetch((o) => api.roster(o), []);
  const news = useFetch((o) => api.news(o), []);

  const hitters = (roster.data?.players || []).filter((p) => !p.is_pitcher);

  return (
    <>
      {/* 선수 그래프 그리드 — 옅은 회색 full-bleed 밴드 */}
      <section className="w-full bg-gray-50 py-5 md:py-9">
        <Container>
          <div className="mb-3 flex items-baseline justify-between md:mb-4">
            <div>
              <h2 className="text-base font-bold text-lg-ink md:text-xl">주요 선수 스탯</h2>
              <p className="text-xs text-gray-400 md:text-sm">
                OPS 상위 타자 · 카드를 누르면 전체 시계열
              </p>
            </div>
            <Link to="/players" className="shrink-0 text-xs font-semibold text-lg-red md:text-sm">
              전체 선수 →
            </Link>
          </div>

          {roster.loading && <PlayerGridSkeleton />}
          {roster.error && <ErrorState message={roster.error} onRetry={() => location.reload()} />}
          {roster.data && <PlayerDashboard hitters={hitters} />}
        </Container>
      </section>

      {/* 최신 뉴스 — 흰 full-bleed 밴드 */}
      <section className="w-full bg-white py-5 md:py-9">
        <Container>
          <div className="mb-3 flex items-baseline justify-between md:mb-4">
            <h2 className="text-base font-bold text-lg-ink md:text-xl">최신 뉴스</h2>
            <Link to="/news" className="text-xs font-semibold text-lg-red md:text-sm">
              더보기 →
            </Link>
          </div>
          {news.loading && <Loading />}
          {news.error && <ErrorState message={news.error} />}
          {news.data &&
            (news.data.items?.length ? (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3 xl:grid-cols-3">
                {news.data.items.slice(0, 6).map((it) => (
                  <NewsCard key={`${it.oid}-${it.aid}`} item={it} />
                ))}
              </div>
            ) : (
              <Empty label="뉴스가 아직 없습니다." />
            ))}
        </Container>
      </section>
    </>
  );
}

function PlayerDashboard({ hitters }) {
  const { loading, results } = usePlayers(hitters);

  if (loading) return <PlayerGridSkeleton />;

  // OPS 내림차순, 소표본 제외. 자격자가 부족하면 전체에서 채움.
  const withStats = results
    .filter((r) => r.data?.series?.length)
    .map((r) => ({
      ...r,
      ops: r.data.series[r.data.series.length - 1].cum_ops ?? 0,
    }));
  const qualified = withStats.filter((r) => (r.data.games || 0) >= MIN_GAMES);
  const pool = qualified.length >= TOP_N ? qualified : withStats;
  const top = pool.sort((a, b) => b.ops - a.ops).slice(0, TOP_N);

  if (!top.length) return <Empty label="선수 스탯을 불러오지 못했습니다." />;

  return (
    <div className={CARD_GRID}>
      {top.map((r) => (
        <PlayerCard key={r.player.playerId} player={r.player} data={r.data} />
      ))}
    </div>
  );
}

function PlayerGridSkeleton() {
  return (
    <div className={CARD_GRID}>
      {Array.from({ length: TOP_N }).map((_, i) => (
        <PlayerCardSkeleton key={i} />
      ))}
    </div>
  );
}
