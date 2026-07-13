import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../hooks/useFetch";
import { usePlayers } from "../hooks/usePlayers";
import { Container } from "../components/Container";
import { NewsCard } from "../components/NewsCard";
import { PlayerCard, PlayerCardSkeleton } from "../components/PlayerCard";
import { Loading, ErrorState, Empty } from "../components/States";

const TOP_N = 12; // 홈 시세판에 노출할 코인 수(4열 3줄)

// 코인 카드: 모바일 2열 → lg 3열 → xl 4열
const CARD_GRID = "grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4";

export default function Home() {
  const roster = useFetch((o) => api.roster(o), []);
  const news = useFetch((o) => api.news(o), []);

  const players = roster.data?.players || [];

  return (
    <>
      {/* 트윈스 코인 시세판 — 옅은 회색 full-bleed 밴드 */}
      <section className="w-full bg-gray-50 py-5 md:py-9">
        <Container>
          <div className="mb-3 flex items-baseline justify-between md:mb-4">
            <div>
              <h2 className="text-base font-bold text-lg-ink md:text-xl">🪙 트윈스 코인 시세판</h2>
              <p className="text-xs text-gray-400 md:text-sm">
                경기 기여도로 매긴 선수 가치 지수 · 카드를 누르면 캔들 차트
              </p>
            </div>
            <Link to="/players" className="shrink-0 text-xs font-semibold text-lg-red md:text-sm">
              전체 선수 →
            </Link>
          </div>

          {roster.loading && <PlayerGridSkeleton />}
          {roster.error && <ErrorState message={roster.error} onRetry={() => location.reload()} />}
          {roster.data && <CoinBoard players={players} />}
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

function CoinBoard({ players }) {
  const { loading, results } = usePlayers(players);

  if (loading) return <PlayerGridSkeleton />;

  // 현재 코인가격(마지막 종가) 내림차순 = 시세 상위
  const priced = results
    .map((r) => {
      const c = r.data?.coin?.candles || [];
      return { ...r, price: c.length ? c[c.length - 1].close : 0 };
    })
    .filter((r) => r.price > 0)
    .sort((a, b) => b.price - a.price)
    .slice(0, TOP_N);

  if (!priced.length) return <Empty label="코인 시세를 불러오지 못했습니다." />;

  return (
    <div className={CARD_GRID}>
      {priced.map((r) => (
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
