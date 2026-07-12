// 로딩 / 에러 / 빈 데이터 상태 — 어떤 화면에서도 재사용.

export function Loading({ label = "불러오는 중…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-lg-red" />
      <p className="mt-3 text-sm">{label}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-sm text-gray-500">{message || "데이터를 불러오지 못했습니다."}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-full border border-lg-red px-4 py-1.5 text-sm font-medium text-lg-red active:scale-95"
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function Empty({ label = "표시할 내용이 없습니다." }) {
  return (
    <div className="flex items-center justify-center py-16">
      <p className="text-sm text-gray-400">{label}</p>
    </div>
  );
}
