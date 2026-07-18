import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useFetch } from "../hooks/useFetch";
import { usePlayers } from "../hooks/usePlayers";
import { Container } from "../components/Container";
import { NewsCard } from "../components/NewsCard";
import { CandleChart } from "../components/CandleChart";
import { StatusCard } from "../components/StatusCard";
import { Loading, ErrorState, Empty } from "../components/States";

// 표시 선수(4명) 커스텀 — localStorage(기기 단위, 타자4·투수4 각각).
const selKey = (pos) => `coinBoard.${pos}`;
function loadSel(pos) {
  try {
    const v = JSON.parse(localStorage.getItem(selKey(pos)));
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
function saveSel(pos, ids) {
  try {
    localStorage.setItem(selKey(pos), JSON.stringify(ids.slice(0, 4)));
  } catch {
    // 저장 실패 무시
  }
}

export default function Home() {
  const roster = useFetch((o) => api.roster(o), []);
  const news = useFetch((o) => api.news(o), []);
  const games = useFetch((o) => api.games(o), []);
  const masterDates = games.data?.dates || null;

  return (
    <section className="w-full bg-gray-50 py-5 md:py-9">
      <Container>
        {/* 데스크톱: 좌 시세판 2/3 + 우 뉴스 1/3. 모바일: 시세판 먼저, 뉴스 아래. */}
        <div className="grid gap-6 md:grid-cols-[2fr_minmax(260px,1fr)] md:gap-8">
          {/* 좌 — 코인 시세판 */}
          <div>
            {roster.loading && <BoardSkeleton />}
            {roster.error && <ErrorState message={roster.error} onRetry={() => location.reload()} />}
            {roster.data && <CoinBoard roster={roster.data} masterDates={masterDates} />}
          </div>

          {/* 우 — 뉴스 컬럼 */}
          <aside>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-base font-bold text-lg-ink md:text-lg">최신 뉴스</h2>
              <Link to="/news" className="text-xs font-semibold text-lg-red">
                더보기 →
              </Link>
            </div>
            {news.loading && <Loading />}
            {news.error && <ErrorState message={news.error} />}
            {news.data &&
              (news.data.items?.length ? (
                <div className="flex flex-col gap-2">
                  {news.data.items.slice(0, 8).map((it) => (
                    <NewsCard key={`${it.oid}-${it.aid}`} item={it} />
                  ))}
                </div>
              ) : (
                <Empty label="뉴스가 아직 없습니다." />
              ))}
          </aside>
        </div>
      </Container>
    </section>
  );
}

function CoinBoard({ roster, masterDates }) {
  const players = roster.players || [];
  const { loading, results } = usePlayers(players);
  const [pos, setPos] = useState("bat");
  const [editing, setEditing] = useState(false);
  const [sel, setSel] = useState({ bat: loadSel("bat"), pit: loadSel("pit") });

  if (loading) return <BoardSkeleton />;

  // pid -> {player, data, price, delta}
  const byId = {};
  for (const r of results) {
    const c = r.data?.coin?.candles || [];
    const last = c[c.length - 1];
    byId[r.player.playerId] = {
      player: r.player,
      data: r.data,
      price: last ? last.close : 0,
      delta: last ? last.close - last.open : 0,
    };
  }

  const isPos = (p) => (pos === "pit" ? p.is_pitcher : !p.is_pitcher);
  const posPlayers = players
    .filter(isPos)
    .map((p) => byId[p.playerId])
    .filter((x) => x && x.price > 0);

  // 선택(유효분) 또는 기본 = 코인가 상위 4
  let ids = (sel[pos] || []).filter((id) => byId[id]?.price > 0 && isPos(byId[id].player));
  if (ids.length === 0) {
    ids = [...posPlayers].sort((a, b) => b.price - a.price).slice(0, 4).map((x) => x.player.playerId);
  }
  const cards = ids.slice(0, 4).map((id) => byId[id]).filter(Boolean);

  const applyEdit = (newIds) => {
    saveSel(pos, newIds);
    setSel((s) => ({ ...s, [pos]: newIds }));
    setEditing(false);
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 md:mb-4">
        <div>
          <h2 className="text-base font-bold text-lg-ink md:text-xl">트윈스 코인</h2>
          <p className="text-xs text-gray-400 md:text-sm">경기 기여도로 매긴 선수 지수 · 카드를 누르면 상세</p>
        </div>
        <div className="flex items-center gap-2">
          {/* 타자/투수 토글 */}
          <div className="inline-flex rounded-full bg-gray-200 p-0.5">
            {[["bat", "타자"], ["pit", "투수"]].map(([k, label]) => (
              <button
                key={k}
                onClick={() => { setPos(k); setEditing(false); }}
                className={`rounded-full px-3.5 py-1 text-sm font-semibold transition-colors ${
                  pos === k ? "bg-white text-lg-red shadow-sm" : "text-gray-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setEditing(true)}
            title="표시 선수 편집"
            className="inline-flex h-8 items-center gap-1 rounded-full border border-gray-300 px-3 text-xs font-semibold text-gray-500 hover:border-lg-red hover:text-lg-red"
          >
            <Gear /> 편집
          </button>
        </div>
      </div>

      {cards.length ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {cards.map((item) => (
            <CandleCard key={item.player.playerId} item={item} masterDates={masterDates} />
          ))}
        </div>
      ) : (
        <Empty label="표시할 선수가 없습니다." />
      )}

      <div className="mt-3 text-right">
        <Link to="/players" className="text-xs font-semibold text-lg-red md:text-sm">
          전체 선수 →
        </Link>
      </div>

      {/* 능력치 스탯창 — 코인가 1위 타자 + 1위 투수 */}
      <StatSection byId={byId} />

      {editing && (
        <EditModal
          pos={pos}
          options={posPlayers}
          current={ids.slice(0, 4)}
          onSave={applyEdit}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

function CandleCard({ item, masterDates }) {
  const { player, data, price, delta } = item;
  const up = delta >= 0;
  return (
    <Link
      to={`/players?id=${player.playerId}`}
      className="flex flex-col rounded-2xl border border-gray-100 bg-white p-3 active:bg-lg-soft md:p-4 md:transition-shadow md:hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-extrabold text-lg-ink md:text-base">{player.name}</p>
          <p className="text-[11px] text-gray-400">
            <span className={player.is_pitcher ? "text-blue-500" : "text-lg-red"}>
              {player.is_pitcher ? "투" : "타"}
            </span>{" "}
            {player.position}
          </p>
        </div>
        <div className="text-right leading-none">
          <p className="text-lg font-black text-lg-ink">{price.toFixed(1)}</p>
          <p className={`mt-0.5 text-[11px] font-bold ${up ? "text-lg-red" : "text-blue-600"}`}>
            {up ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}
          </p>
        </div>
      </div>
      <div className="mt-2">
        <CandleChart
          candles={data.coin.candles}
          base={data.coin.base}
          masterDates={masterDates}
          compact
          windowN={35}
        />
      </div>
    </Link>
  );
}

function StatSection({ byId }) {
  const rated = (isP) =>
    Object.values(byId)
      .filter((x) => x.data?.ratings?.axes?.length && (isP ? x.player.is_pitcher : !x.player.is_pitcher))
      .sort((a, b) => b.price - a.price)[0];
  const topHit = rated(false);
  const topPit = rated(true);
  if (!topHit && !topPit) return null;

  return (
    <section className="mt-8">
      <h3 className="mb-1 text-base font-bold text-lg-ink md:text-lg">능력치</h3>
      <p className="mb-3 text-xs text-gray-400">코인가 상위 선수 · 카드를 누르면 상세 상태창</p>
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {topHit && <StatLink item={topHit} />}
        {topPit && <StatLink item={topPit} />}
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-gray-400">
        박스스코어 기반 능력 근사 · 수비/구속/회전수/멘탈 제외 · 리그 백분위(0~100).
      </p>
    </section>
  );
}

function StatLink({ item }) {
  const { player, data } = item;
  return (
    <Link
      to={`/players?id=${player.playerId}&view=status`}
      className="block rounded-2xl md:transition-transform md:hover:-translate-y-0.5"
    >
      <StatusCard player={player} ratings={data.ratings} compact />
    </Link>
  );
}

function EditModal({ pos, options, current, onSave, onClose }) {
  const [picked, setPicked] = useState(current);
  const toggle = (id) => {
    setPicked((p) => {
      if (p.includes(id)) return p.filter((x) => x !== id);
      if (p.length >= 4) return p; // 최대 4
      return [...p, id];
    });
  };
  const sorted = [...options].sort((a, b) => b.price - a.price);

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-0 md:items-center md:p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-t-2xl bg-white md:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <div>
            <p className="font-bold text-lg-ink">{pos === "pit" ? "투수" : "타자"} 4명 선택</p>
            <p className="text-xs text-gray-400">{picked.length}/4 선택됨</p>
          </div>
          <button onClick={onClose} className="text-sm text-gray-400">닫기</button>
        </div>
        <div className="max-h-[52vh] overflow-y-auto p-2">
          {sorted.map((x) => {
            const id = x.player.playerId;
            const on = picked.includes(id);
            const disabled = !on && picked.length >= 4;
            return (
              <button
                key={id}
                onClick={() => toggle(id)}
                disabled={disabled}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left ${
                  on ? "bg-lg-soft" : "hover:bg-gray-50"
                } ${disabled ? "opacity-40" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`grid h-5 w-5 place-items-center rounded-md border text-[11px] ${
                      on ? "border-lg-red bg-lg-red text-white" : "border-gray-300 text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="font-semibold text-lg-ink">{x.player.name}</span>
                  <span className="text-xs text-gray-400">{x.player.position}</span>
                </span>
                <span className="text-sm font-bold text-gray-500">{x.price.toFixed(1)}</span>
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 border-t border-gray-100 p-3">
          <button onClick={onClose} className="flex-1 rounded-full border border-gray-300 py-2 text-sm font-semibold text-gray-500">
            취소
          </button>
          <button
            onClick={() => onSave(picked)}
            disabled={picked.length === 0}
            className="flex-1 rounded-full bg-lg-red py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}

function BoardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-gray-100 bg-white p-3 md:p-4">
          <div className="flex justify-between">
            <div className="space-y-1.5">
              <div className="h-3.5 w-16 rounded bg-gray-100" />
              <div className="h-2.5 w-10 rounded bg-gray-100" />
            </div>
            <div className="h-4 w-10 rounded bg-gray-100" />
          </div>
          <div className="mt-3 h-[116px] animate-pulse rounded bg-gray-50 md:h-[140px]" />
        </div>
      ))}
    </div>
  );
}

function Gear() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
