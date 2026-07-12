import { api } from "../lib/api";
import { useFetch } from "../hooks/useFetch";
import { NewsCard } from "../components/NewsCard";
import { Loading, ErrorState, Empty } from "../components/States";

export default function News() {
  const { loading, error, data } = useFetch((o) => api.news(o), []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-4">
      <h1 className="mb-1 text-xl font-black text-lg-ink">LG 트윈스 뉴스</h1>
      <p className="mb-4 text-xs text-gray-400">
        헤드라인만 모았습니다. 탭하면 원문으로 이동합니다.
      </p>

      {loading && <Loading />}
      {error && <ErrorState message={error} onRetry={() => location.reload()} />}
      {data &&
        (data.items?.length ? (
          <div className="flex flex-col gap-2">
            {data.items.map((it) => (
              <NewsCard key={`${it.oid}-${it.aid}`} item={it} />
            ))}
          </div>
        ) : (
          <Empty label="뉴스가 아직 없습니다." />
        ))}
    </div>
  );
}
