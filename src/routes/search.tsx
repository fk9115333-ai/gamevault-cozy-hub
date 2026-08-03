import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search, Loader2, Plus, ShoppingBag } from "lucide-react";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s["q"] === "string" ? (s["q"] as string) : "" }),
  head: () => ({
    meta: [
      { title: "بحث ألعاب ستيم — GameVault" },
      {
        name: "description",
        content: "ابحث في متجر Steam وسجل ألعابك المفضلة فورًا.",
      },
    ],
  }),
  component: SearchPage,
});

const quickAdd: { status: Status; label: string }[] = [
  { status: "current", label: "قيد اللعب" },
  { status: "backlog", label: "الانتظار" },
  { status: "hype", label: "المرتقبة" },
  { status: "completed", label: "مكتملة" },
];

interface SteamGame {
  id: string;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  url: string;
  genres: string;
}

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate();
  const [term, setTerm] = useState(q);
  const addGame = useStore((s) => s.addGame);

  // البحث المباشر عبر CheapShark / Steam API الموثوق والسريع للـ PC
  const { data, isFetching } = useQuery({
    queryKey: ["steam-search", q],
    queryFn: async () => {
      if (!q || q.trim().length < 2) return [];
      const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?storeID=1&title=${encodeURIComponent(q)}&pageSize=20`);
      const results = await res.json();
      
      return results.map((item: any) => ({
        id: item.dealID,
        name: item.title,
        price: `$${item.salePrice}`,
        originalPrice: `$${item.normalPrice}`,
        discount: item.savings > 0 ? `-${Math.round(parseFloat(item.savings))}%` : undefined,
        image: item.thumb,
        url: `https://store.steampowered.com/app/${item.steamAppID || '1174180'}`,
        genres: "Steam PC Game"
      })) as SteamGame[];
    },
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  const add = (g: SteamGame, status: Status) => {
    buzz(20);
    // توافقية البيانات مع نظام التخزين لديك
    addGame({
      id: Number(g.id.replace(/\D/g, '').slice(0, 8)) || 1,
      name: g.name,
      background_image: g.image,
      released: new Date().getFullYear().toString(),
      metacritic: 85,
      genres: [{ name: g.genres }]
    } as any, status);
    toast.success(`أُضيفت ${g.name} إلى مكتبتك`);
  };

  return (
    <div className="space-y-6 pb-24 pt-6 px-4 max-w-4xl mx-auto text-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: term.trim() } });
        }}
        className="flex items-center gap-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 px-4 py-3 shadow-xl"
      >
        <Search className="size-4 shrink-0 text-blue-400" />
        <input
          autoFocus
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن أي لعبة في ستيم..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-500 text-white"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-blue-500" />}
      </form>

      <div className="flex items-baseline justify-between">
        <h1 className="font-bold text-xl">
          نتائج البحث {q && <bdi className="text-blue-400">«{q}»</bdi>}
        </h1>
        {data && <span className="text-xs text-neutral-400">{data.length} لعبة</span>}
      </div>

      {q.trim().length < 2 && (
        <p className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
          اكتب حرفين على الأقل لبدء البحث في متجر ستيم
        </p>
      )}

      {isFetching && !data && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-neutral-900" />
          ))}
        </div>
      )}

      {data?.length === 0 && q.trim().length >= 2 && (
        <p className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-sm text-neutral-400">
          لا توجد نتائج مطابقة في ستيم
        </p>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {data?.map((g) => (
          <div
            key={g.id}
            className="group overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/90 transition-all hover:border-blue-500/40 shadow-md"
          >
            <a href={g.url} target="_blank" rel="noopener noreferrer" className="block">
              <div className="relative aspect-[16/10] overflow-hidden">
                {g.image ? (
                  <img
                    src={g.image}
                    alt={g.name}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="size-full bg-neutral-800" />
                )}
                {g.discount && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-lg text-[10px] font-black text-black bg-amber-400 shadow-md">
                    {g.discount}
                  </span>
                )}
              </div>
              <div className="space-y-1 p-3">
                <p className="text-sm font-bold leading-snug break-words line-clamp-1 text-neutral-100">
                  <bdi>{g.name}</bdi>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-neutral-500 line-through">{g.originalPrice}</span>
                  <span className="text-xs font-bold text-emerald-400">{g.price}</span>
                </div>
              </div>
            </a>
            <div className="flex flex-wrap gap-1 px-3 pb-3">
              {quickAdd.map((a) => (
                <Button
                  key={a.status}
                  size="sm"
                  variant="secondary"
                  className="h-7 rounded-lg px-2 text-[11px] bg-neutral-800 hover:bg-neutral-700 text-neutral-200"
                  onClick={() => add(g, a.status)}
                >
                  <Plus className="size-3" />
                  {a.label}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
