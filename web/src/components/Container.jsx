// 콘텐츠 정렬용 컨테이너(가로 패딩만). 배경은 바깥 full-bleed 밴드가 담당한다.
// 모바일은 좁게 유지, 큰 화면에서는 대시보드에 맞춰 넓게(최대 1700px).
export function Container({ className = "", children }) {
  return (
    <div
      className={`mx-auto w-full max-w-2xl px-4 md:max-w-7xl md:px-8 2xl:max-w-[1700px] ${className}`}
    >
      {children}
    </div>
  );
}
