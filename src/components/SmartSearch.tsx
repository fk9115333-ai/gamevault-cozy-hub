import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Search, Plus, Loader2 } from "lucide-react";
import { searchGames, type RawgGame } from "@/lib/rawg";
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

export function SmartSearch() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const addGame = useStore((s) => s.addGame);
  const entry = useStore((s) =>
    editId ? (s.users[s.currentUser].entries.find((e) => e.id === editId) ?? null) : null,
  );

  const { data, isFetching } = useQuery({
    queryKey: ["search", q],
    queryFn: () => searchGames(q),
    enabled: q.trim().length >= 2,
    staleTime: 1000 * 60 * 10,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const pick = (g: RawgGame) => {
    setOpen(false);
    setQ("");
    navigate({ to: "/game/$id", params: { id: String(g.id) } });
  };

  const add = (g: RawgGame, status: Status) => {
    buzz(status === "completed" ? [40, 60, 40] : 20);
    addGame(g, status);
    setOpen(false);
    setQ("");
    if (status === "completed") setEditId(g.id);
    else toast.success(`أُضيفت ${g.name}`);
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
      <div className="flex items-center gap-2 rounded-2xl glass px-4 py-2.5">
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ابحث عن أي لعبة… اكتب حرفين فقط"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {isFetching && <Loader2 className="size-4 animate-spin text-primary" />}
      </div>

      {open && q.trim().length >= 2 && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 max-h-[70vh] overflow-y-auto rounded-3xl glass p-2">
          {!data && (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-secondary/60" />
              ))}
            </div>
          )}
          {data?.length === 0 && (
            <p className="p-4 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
          )}
          {data?.map((g) => (
            <div
              key={g.id}
              className="group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-secondary/60"
              onClick={() => pick(g)}
            >
              <img
                src={g.background_image ?? "/favicon.ico"}
                alt={g.name}
                loading="lazy"
                className="size-16 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{g.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {g.released?.slice(0, 4) ?? "—"} · {(g.genres ?? []).map((x) => x.name).join("، ")}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {g.developers?.[0]?.name ?? ""}
                  {g.metacritic ? ` · ميتاكريتيك ${g.metacritic}` : ""}
                  {g.rating ? ` · ★ ${g.rating}` : ""}
                </p>
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
        </div>
      )}
    </div>
  );
}
