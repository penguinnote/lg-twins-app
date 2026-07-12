import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "홈", icon: HomeIcon, end: true },
  { to: "/news", label: "뉴스", icon: NewsIcon },
  { to: "/players", label: "선수", icon: ChartIcon },
];

// 상단바 — full-bleed 레드→다크 그라데이션 밴드(화면 끝까지), 콘텐츠는 컨테이너 정렬.
export function TopBar() {
  return (
    <header className="sticky top-0 z-20 w-full bg-gradient-to-r from-lg-crimson via-lg-red to-lg-crimson shadow-sm">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4 md:h-16 md:max-w-7xl md:px-8 2xl:max-w-[1700px]">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-white text-[13px] font-black italic text-lg-red">
          LG
        </span>
        <span className="text-[15px] font-extrabold tracking-tight text-white">
          트윈스 <span className="font-medium text-white/70">팬</span>
        </span>
        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {tabs.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
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
