import { HexRadar } from "./HexRadar";

// 선수 상태창(HUD) — 어두운 카드 + 레드 강조 + 육각 레이더 + OVR.
// compact=true → 축 상세표·고지 없이 레이더 + OVR + 상위 능력치 2개(홈 배치용).
export function StatusCard({ player, ratings, compact = false }) {
  if (!ratings || !ratings.axes?.length) {
    return (
      <div className="rounded-2xl bg-[#111318] p-8 text-center text-sm text-gray-400">
        능력치 데이터가 아직 없습니다.
      </div>
    );
  }
  const low = ratings.lowSample;
  const top2 = [...ratings.axes].sort((a, b) => b.rating - a.rating).slice(0, 2);

  return (
    <div className="rounded-2xl bg-[#111318] p-4 text-white md:p-6">
      {/* 상단: 선수정보 + OVR */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-lg font-black md:text-xl">{player.name}</p>
          <p className="mt-0.5 text-xs text-gray-400">
            <span className={player.is_pitcher ? "text-sky-400" : "text-[#E4002B]"}>
              {player.is_pitcher ? "투수" : "타자"}
            </span>{" "}
            · LG 트윈스
          </p>
        </div>
        <div className="text-right">
          <p className="font-bebas text-5xl leading-none text-[#E4002B]">{ratings.OVR}</p>
          <p className="text-[10px] tracking-widest text-gray-400">OVR</p>
        </div>
      </div>

      {low && (
        <div className="mt-2 inline-block rounded-full border border-amber-500/50 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
          ⚠ 표본 부족 — 참고용
        </div>
      )}

      {/* 레이더 */}
      <div className={`mx-auto mt-2 max-w-[340px] ${low ? "opacity-60" : ""}`}>
        <HexRadar axes={ratings.axes} dim={low} />
      </div>

      {compact ? (
        /* 상위 능력치 2개 */
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {top2.map((a) => (
            <span key={a.key} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold">
              {a.label} <span className="text-[#E4002B]">{a.rating}</span>
            </span>
          ))}
        </div>
      ) : (
        <>
          {/* 축 상세 (원지표 값) */}
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {ratings.axes.map((a) => (
              <div key={a.key} className="flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-gray-400">{a.label}</span>
                <span className="tabular-nums">
                  <span className="text-gray-500">{formatVal(a.key, a.value)}</span>{" "}
                  <span className="font-bold text-white">{a.rating}</span>
                </span>
              </div>
            ))}
          </div>

          {/* 투명성 고지 */}
          <p className="mt-3 text-[11px] leading-relaxed text-gray-500">
            박스스코어 기반 <b className="text-gray-400">능력 근사 · 리그 백분위(0~100)</b>. 수비·구속·회전수·
            멘탈은 KBO 공개데이터에 없어 제외.
          </p>
        </>
      )}
    </div>
  );
}

// 원지표 표시 포맷(축 종류별)
function formatVal(key, v) {
  if (v == null) return "-";
  const rate3 = ["contact", "power", "eye", "avoidK", "production", "hits"];
  if (rate3.includes(key)) {
    const s = Number(v).toFixed(3);
    return s.startsWith("0.") ? s.slice(1) : s;
  }
  if (["speed"].includes(key)) return String(v); // 정수
  return Number(v).toFixed(1); // BB/9, K/9, HR/9, IP, FIP
}
