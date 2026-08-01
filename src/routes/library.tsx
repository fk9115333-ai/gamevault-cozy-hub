import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentData, type Status } from "@/lib/store";
import { GameCard } from "@/components/GameCard";
import { GameEditDialog } from "@/components/GameEditDialog";
import { Confetti } from "@/components/Confetti";
import { EmptyState, SectionTitle } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { num } from "@/lib/dates";
import { computeFranchises } from "@/lib/stats";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة — GameHub" },
      { name: "description", content: "كل ألعابك: قيد اللعب، المكتملة، قائمة الانتظار، الرغبات والسلاسل." },
      { property: "og:title", content: "المكتبة — GameHub" },
      { property: "og:description", content: "إدارة كاملة لمكتبة ألعابك مع تتبع السلاسل." },
    ],
  }),
  component: LibraryPage,
});

const tabs: { v: Status | "all" | "favorites"; l: string }[] = [
  { v: "all", l: "الكل" },
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "المكتملة" },
  { v: "backlog", l: "الانتظار" },
  { v: "wishlist", l: "الرغبات" },
  { v: "hype", l: "المرتقبة" },
  { v: "favorites", l: "المفضلة" },
];

const sorts = [
  { v: "added", l: "الأحدث" },
  { v: "name", l: "الاسم" },
  { v: "rating", l: "التقييم" },
  { v: "hours", l: "الساعات" },
] as const;

function LibraryPage() {
  const data = useCurrentData();
  const [tab, setTab] = useState<(typeof tabs)[number]["v"]>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<(typeof sorts)[number]["v"]>("added");
  const [celebrate, setCelebrate] = useState(false);

  const list = useMemo(() => {
    let out = data.entries.filter((e) =>
      tab === "all" ? true : tab === "favorites" ? e.favorite : e.status === tab,
    );
    if (q.trim()) out = out.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
    return [...out].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "rating") return b.personalRating - a.personalRating;
      if (sort === "hours") return b.hours - a.hours;
      return b.addedAt.localeCompare(a.addedAt);
    });
  }, [data.entries, tab, q, sort]);

  const franchises = useMemo(() => computeFranchises(data.entries), [data.entries]);

  const backlogHours = data.entries
    .filter((e) => e.status === "backlog")
    .reduce((s, e) => s + (e.playtimeEstimate || 10), 0);

  return (
    <div className="space-y-10">
      <Confetti run={celebrate} />
      <div className="space-y-6">
        <SectionTitle
          title="المكتبة"
          subtitle={`${num(list.length)} لعبة · وقت متبقٍ لإنهاء قائمة الانتظار ≈ ${num(backlogHours)} ساعة`}
        />

        <div className="flex flex-wrap items-center gap-2">
          {tabs.map((t) => (
            <Button
              key={t.v}
              size="sm"
              variant={tab === t.v ? "default" : "secondary"}
              className="rounded-xl"
              onClick={() => setTab(t.v)}
            >
              {t.l}
            </Button>
          ))}
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="بحث داخل المكتبة"
            className="h-9 w-44 rounded-xl"
          />
          <div className="flex gap-1">
            {sorts.map((s) => (
              <Button
                key={s.v}
                size="sm"
                variant={sort === s.v ? "default" : "ghost"}
                className="rounded-xl text-xs"
                onClick={() => setSort(s.v)}
              >
                {s.l}
              </Button>
            ))}
          </div>
        </div>

        {list.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {list.map((e, i) => (
              <div key={e.id} className="relative">
                <GameCard entry={e} index={i} />
                <GameEditDialog
                  entry={e}
                  onCompleted={() => {
                    setCelebrate(true);
                    setTimeout(() => setCelebrate(false), 4000);
                  }}
                  trigger={
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute left-3 top-14 size-9 rounded-full"
                    >
                      <Pencil className="size-4" />
                    </Button>
                  }
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="لا توجد ألعاب هنا بعد." />
        )}
      </div>

      <div>
        <SectionTitle title="السلاسل" subtitle="تقدمك في كل سلسلة مع اقتراح الجزء التالي" />
        {franchises.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {franchises.map((f) => (
              <div key={f.name} className="rounded-3xl border border-border bg-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-display font-bold">{f.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {num(f.done)}/{num(f.total)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-[var(--gradient-primary)]"
                    style={{ width: `${f.pct}%` }}
                  />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {num(f.hours)} ساعة · {num(f.pct)}% مكتمل
                </p>
                {f.suggestion && (
                  <p className="mt-3 rounded-2xl bg-secondary/60 px-3 py-2 text-[11px]">
                    ✨ الجزء التالي المقترح: <span className="font-bold">{f.suggestion}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState text="أضف ألعابًا من سلاسل معروفة لتظهر هنا." />
        )}
      </div>
    </div>
  );
}
