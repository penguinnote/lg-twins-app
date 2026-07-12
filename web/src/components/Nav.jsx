import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "홈", icon: HomeIcon, end: true },
  { to: "/news", label: "뉴스", icon: NewsIcon },
  { to: "/players", label: "선수", icon: ChartIcon },
];

export function TopBar() {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-2xl items-center gap-2 px-4">
        <span className="grid h-7 w-7 place-items-center rounded-md bg-lg-red text-[13px] font-black italic text-white">
          LG
        </span>
        <span className="text-[15px] font-extrabold tracking-tight text-lg-ink">
          트윈스 <span className="font-medium text-gray-400">팬</span>
        </span>
      </div>
    </header>
  );
}

export function BottomNav() {
  return (
    <nav className="safe-b sticky bottom-0 z-10 border-t border-gray-100 bg-white">
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
