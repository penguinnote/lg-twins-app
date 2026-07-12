// 반응형 컨테이너 — 모바일은 좁은 중앙 컬럼(현행 유지), 데스크톱(md+)은 넓게.
// 초광폭에서도 max-w-6xl로 묶어 줄 길이가 과하게 길어지지 않게 한다.
export function Container({ className = "", children }) {
  return (
    <div className={`mx-auto w-full max-w-2xl px-4 md:max-w-6xl md:px-8 ${className}`}>
      {children}
    </div>
  );
}
