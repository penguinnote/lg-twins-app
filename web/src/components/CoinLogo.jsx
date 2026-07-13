// 트윈스 코인 확정 로고. 헤더/브랜드에 사용(파비콘·매니페스트는 public/favicon.svg 동일 소스).
// 크기는 className(h-/w-)으로 제어. 작은 크기에선 테두리 글자가 안 읽혀도 정상(코인+T는 또렷).
export function CoinLogo({ className = "" }) {
  return (
    <svg
      viewBox="0 0 200 200"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TWINS COIN"
      className={className}
    >
      <defs>
        <path id="tcTop" d="M21,100 A79,79 0 0 1 179,100" />
        <path id="tcBot" d="M21,100 A79,79 0 0 0 179,100" />
      </defs>
      <circle cx="100" cy="100" r="97" fill="#0b0b0b" />
      <circle cx="100" cy="100" r="95" fill="none" stroke="#3f3f3f" strokeWidth="8" strokeDasharray="2 3" />
      <circle cx="100" cy="100" r="89" fill="#282828" />
      <circle cx="100" cy="100" r="89" fill="none" stroke="#6a6a6a" strokeWidth="1" />
      <g fill="#d2d2d2" fontFamily="Georgia,serif" fontSize="12" letterSpacing="2.5" fontWeight="700" dominantBaseline="central">
        <text>
          <textPath href="#tcTop" startOffset="50%" textAnchor="middle">TWINS · COIN</textPath>
        </text>
        <text>
          <textPath href="#tcBot" startOffset="50%" textAnchor="middle">LG TWINS</textPath>
        </text>
      </g>
      <rect x="-3" y="-3" width="6" height="6" transform="translate(21,100) rotate(45)" fill="#d2d2d2" />
      <rect x="-3" y="-3" width="6" height="6" transform="translate(179,100) rotate(45)" fill="#d2d2d2" />
      <circle cx="100" cy="100" r="70" fill="#ffffff" />
      <circle cx="100" cy="100" r="70" fill="none" stroke="#cfcfcf" strokeWidth="1" />
      <g transform="translate(40,35) scale(0.6)" strokeLinejoin="round">
        <path d="M34,46 L166,46 L166,78 L116,78 L116,172 L84,172 L84,78 L34,78 Z" fill="none" stroke="#0b0b0b" strokeWidth="14.4" />
        <path d="M34,46 L166,46 L166,78 L116,78 L116,172 L84,172 L84,78 L34,78 Z" fill="none" stroke="#ffffff" strokeWidth="8" />
        <path d="M34,46 L166,46 L166,78 L116,78 L116,172 L84,172 L84,78 L34,78 Z" fill="#C4122E" />
      </g>
    </svg>
  );
}
