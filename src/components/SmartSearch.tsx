import { useEffect, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, Plus, Loader2 } from "lucide-react";
import { useStore, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { GameEditDialog } from "@/components/GameEditDialog";

const quickAdd: { status: Status; label: string }[] = [
  { status: "current", label: "قيد اللعب" },
  { status: "backlog", label: "الانتظار" },
  { status: "hype", label: "المرتقبة" },
  { status: "completed", label: "مكتملة" },
];

interface SteamGame {
  id: number;
  name: string;
  price: string;
  originalPrice?: string;
  discount?: string;
  image: string;
  url: string;
}

export function SmartSearch() {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const addGame = useStore((s) => s.addGame);
  const entry = useStore((s) =>
    editId ? (s.users[s.currentUser].entries.find((e) => e.id === editId) ?? null) : null,
  );

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 160);
    return () => clearTimeout(t);
  }, [q]);

  // البحث المباشر عبر Steam / CheapShark API
  const { data, isFetching } = useQuery({
    queryKey: ["steam-smart-search", debounced],
    queryFn: async () => {
      if (!debounced || debounced.length < 2) return [];
      const res = await fetch(`https://www.cheapshark.com/api/1.0/deals?storeID=1&title=${encodeURIComponent(debounced)}&pageSize=10`);
      const results = await res.json();
      return results.map((item: any) => ({
        id: Number(item.dealID.replace(/\D/g, '').slice(0, 8)) || Math.floor(Math.random() * 100000),
        name: item.title,
        price: `$${item.salePrice}`,
        originalPrice: `$${item.normalPrice}`,
        discount: item.savings > 0 ? `-${Math.round(parseFloat(item.savings))}%` : undefined,
        image: item.thumb,
        url: `https://store.steampowered.com/app/${item.steamAppID || '1174180'}`
      })) as SteamGame[];
    },
    enabled: debounced.length >= 2,
    staleTime: 1000 * 60 * 5,
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (g: SteamGame) => {
    setOpen(false);
    setQ("");
    window.open(g.url, "_blank");
  };

  const submit = () => {
    const term = q.trim();
    if (term.length < 2) return;
    setOpen(false);
    navigate({ to: "/search", search: { q: term } });
  };

  const add = (g: SteamGame, status: Status) => {
    buzz(status === "completed" ? [40, 60, 40] : 20);
    // متوافقة تماماً مع بنية التخزين لديك
    addGame({
      id: g.id,
      name: g.name,
      background_image: g.image,
      released: new Date().getFullYear().toString(),
      metacritic: 85,
      genres: [{ name: "Steam Game" }]
    } as any, status);
    setOpen(false);
    setQ("");
    if (status === "completed") setEditId(g.id);
    else toast.success(`أُضيفت ${g.name} إلى مكتبتك`);
  };

  return (
    <div ref={boxRef} className="relative">
      {entry && (
        <GameEditDialog
          entry={entry}
          open={editId !== null}
          onOpenChange={(o) => !o && setEditId(null)}
        />
      )}
      <div className="flex items-center gap-2 rounded-2xl glass px-4 py-2.5 border border-border">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
            if (e.key === "Escape") setOpen(false);
          }}
          enterKeyHint="search"
          type="search"
          placeholder="ابحث عن أي لعبة في ستيم… اكتب حرفين"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground text-foreground [&::-webkit-search-cancel-button]:hidden"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-3xl glass p-2 border border-border shadow-2xl bg-card">
          {!data && isFetching && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/60" />
              ))}
            </div>
          )}
          {data?.length === 0 && !isFetching && (
            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد نتائج مطابقة في ستيم</p>
          )}
          {data?.map((g) => (
            <div
              key={g.id}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/60"
              onClick={() => pick(g)}
            >
              <div className="relative shrink-0">
                <img
                  src={g.image}
                  alt={g.name}
                  loading="lazy"
                  className="size-14 rounded-xl object-cover"
                />
                {g.discount && (
                  <span className="absolute -bottom-1 right-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[9px] font-black text-black">
                    {g.discount}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-sm font-semibold leading-snug break-words line-clamp-1 text-foreground">
                  <bdi>{g.name}</bdi>
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground line-through">{g.originalPrice}</span>
                  <span className="text-xs font-bold text-emerald-400">{g.price}</span>
                </div>
              </div>

              <div className="hidden shrink-0 gap-1 group-hover:flex md:flex">
                {quickAdd.map((a) => (
                  <Button
                    key={a.status}
                    size="sm"
                    variant="secondary"
                    className="h-7 rounded-lg px-2 text-[11px]"
                    onClick={(e) => {
                      e.stopPropagation();
                      add(g, a.status);
                    }}
                  >
                    <Plus className="size-3" />
                    {a.label}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {!!data?.length && (
            <button
              type="button"
              onClick={submit}
              className="mt-1 w-full rounded-2xl bg-primary/12 px-4 py-2.5 text-center text-sm font-bold text-primary transition-colors hover:bg-primary/20"
            >
              عرض كل نتائج ستيم لـ «{q.trim()}»
            </button>
          )}
        </div>
      )}
    </div>
  );
}
