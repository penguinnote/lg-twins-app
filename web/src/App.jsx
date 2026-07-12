import { Routes, Route } from "react-router-dom";
import { TopBar, BottomNav } from "./components/Nav";
import Home from "./pages/Home";
import News from "./pages/News";
import Players from "./pages/Players";

export default function App() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-white">
      <TopBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/news" element={<News />} />
          <Route path="/players" element={<Players />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
}
