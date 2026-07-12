/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // LG 트윈스 상징색(레드/크림슨)을 포인트로. 화이트 베이스에 절제해 사용.
        lg: {
          red: "#C4012F",
          crimson: "#A4002A",
          navy: "#14213D",
          ink: "#1A1A1A",
          soft: "#FBF3F5",
        },
      },
      fontFamily: {
        sans: ["'Pretendard'", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [],
};
