import { NavLink, Link } from "react-router-dom";
import { CoinLogo } from "./CoinLogo";

const tabs = [
  { to: "/", label: "홈", icon: HomeIcon, end: true },
  { to: "/news", label: "뉴스", icon: NewsIcon },
  { to: "/players", label: "선수", icon: ChartIcon },
];

// 상단바 — full-bleed 레드 밴드(화면 끝까지). 좌: 코인로고 + 이탤릭 "트윈스 코인",
// 우: 탭 알약(활성=흰 배경+빨강 글자 / 비활성=흰 글자+반투명 외곽선). 모바일은 브랜드만(탭은 하단).
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 w-full bg-gradient-to-r from-lg-crimson via-lg-red to-lg-crimson shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8 md:py-4 2xl:max-w-[1700px]">
        <Link to="/" className="flex items-center gap-3">
          <CoinLogo className="h-14 w-14 md:h-16 md:w-16" />
          <span className="font-bebas text-[36px] leading-none tracking-[0.06em] text-white md:text-[44px]">
            TWINS COIN
          </span>
        </Link>
        <nav className="hidden items-center gap-3 md:flex">
          {tabs.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-white text-lg-red shadow-sm"
                    : "border border-white/60 text-white hover:bg-white/10"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

// 하단 탭바 — 모바일 전용(md+에서는 상단 네비로 대체하므로 숨김).
export function BottomNav() {
  return (
    <nav className="safe-b sticky bottom-0 z-20 border-t border-gray-100 bg-white md:hidden">
      <div className="mx-auto flex max-w-2xl">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                isActive ? "text-lg-red" : "text-gray-400"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon active={isActive} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M3 10.5 12 4l9 6.5M5 9.5V20h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function NewsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10M7 12h10M7 16h6" strokeLinecap="round" />
    </svg>
  );
}
function ChartIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
      <path d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
