import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Search, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/home')({
  component: HomeSearchSection,
});

function HomeSearchSection() {
  const [query, setQuery] = useState('');

  const { data: results, isFetching } = useQuery({
    queryKey: ['home-steam-search', query],
    queryFn: async () => {
      if (!query || query.trim().length < 2) return [];
      const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?storeID=1&title=${encodeURIComponent(query)}&pageSize=5`);
      const data = await res.json();
      return data.map((item: any) => ({
        id: item.dealID,
        name: item.title,
        thumb: item.thumb,
        price: `$${item.salePrice}`
      }));
    },
    enabled: query.trim().length >= 2,
  });

  return (
    <div className="relative w-full max-w-md mx-auto px-4 pt-4">
      <div className="flex items-center gap-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 px-4 py-3 shadow-xl">
        <Search className="size-4 shrink-0 text-blue-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن أي لعبة في ستيم..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500 text-white"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-blue-500" />}
      </div>

      {query.trim().length >= 2 && (
        <div className="absolute left-4 right-4 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50">
          {isFetching ? (
            <div className="p-4 text-center text-xs text-neutral-400">جاري البحث في ستيم...</div>
          ) : results?.length === 0 ? (
            <div className="p-4 text-center text-xs text-neutral-400">لا توجد نتائج</div>
          ) : (
            results?.map((game: any) => (
              <a
                key={game.id}
                href={`https://store.steampowered.com`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 hover:bg-neutral-800/60 border-b border-neutral-800/50 last:border-none transition-all"
              >
                <div className="flex items-center gap-3">
                  <img src={game.thumb} alt={game.name} className="w-10 h-8 object-cover rounded-lg" />
                  <span className="text-sm font-bold text-white line-clamp-1">{game.name}</span>
                </div>
                <span className="text-xs font-bold text-emerald-400">{game.price}</span>
              </a>
            ))
          )}
        </div>
      )}
    </div>
  );
}
