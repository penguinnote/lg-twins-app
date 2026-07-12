import { shortDate } from "../lib/format";

// 뉴스 항목 — 본문은 저장하지 않으므로 항상 원문으로 새 탭 이동.
export function NewsCard({ item }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-3.5 active:bg-lg-soft"
    >
      <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lg-red" />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-semibold leading-snug text-lg-ink">
          {item.title}
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {item.office} · {shortDate(item.datetime)}
        </p>
      </div>
      <svg className="mt-1 shrink-0 text-gray-300" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </a>
  );
}
