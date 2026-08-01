import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCurrentData, type GameEntry, type Status } from "@/lib/store";
import { GameCard } from "@/components/GameCard";
import { GameEditDialog } from "@/components/GameEditDialog";
import { CelebrationModal } from "@/components/CelebrationModal";
import { EmptyState, SectionTitle } from "@/components/ui-bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Star } from "lucide-react";
import { num } from "@/lib/dates";
import { computeFranchises } from "@/lib/stats";
import { completionSummary } from "@/lib/completion";

/** بطاقة لعبة مختومة — غرفة الإنجازات */
function CompletedCard({ entry, onOpen }: { entry: GameEntry; onOpen: () => void }) {
  const s = completionSummary(entry);
  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-3xl border border-yellow-500/25 bg-card text-right surface-hover"
    >
      <div className="relative h-32 overflow-hidden">
        {entry.image ? (
          <img
            src={entry.image}
            alt={entry.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="size-full bg-secondary" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
        <span className="absolute right-3 top-3 rounded-full border border-yellow-500/40 bg-background/80 px-2.5 py-1 text-[11px] font-bold backdrop-blur">
          {s.badge.emoji} {s.badge.label}
        </span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="truncate font-display text-sm font-bold">
          <bdi>{entry.name}</bdi>
        </h3>
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 text-accent">
            <Star className="size-3 fill-current" />
            {entry.personalRating ? `${num(entry.personalRating, 1)}/10` : "قيد التقييم"}
          </span>
          <span>{num(s.hours, 1)} ساعة</span>
          <span>خلال {num(s.days ?? 1)} يوم</span>
          {entry.fullCompletion && <span>🏆 100%</span>}
        </div>
      </div>
    </button>
  );
}



export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "المكتبة — GameHub" },
      {
        name: "description",
        content: "كل ألعابك: قيد اللعب، المكتملة، الانتظار والسلاسل.",
      },
      { property: "og:title", content: "المكتبة — GameHub" },
      { property: "og:description", content: "إدارة كاملة لمكتبة ألعابك مع «ناوي أختمها» والسلاسل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LibraryPage,
});

const tabs: { v: Status | "all"; l: string }[] = [
  { v: "all", l: "الكل" },
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "المكتملة" },
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
  const [celebrated, setCelebrated] = useState<GameEntry | null>(null);
  const [reviewed, setReviewed] = useState<GameEntry | null>(null);

  const list = useMemo(() => {
    let out = data.entries.filter((e) => (tab === "all" ? true : e.status === tab));
    if (q.trim()) out = out.filter((e) => e.name.toLowerCase().includes(q.toLowerCase()));
    return [...out].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "rating") return b.personalRating - a.personalRating;
      if (sort === "hours") return b.hours - a.hours;
      return b.addedAt.localeCompare(a.addedAt);
    });
  }, [data.entries, tab, q, sort]);

  const franchises = useMemo(() => computeFranchises(data.entries), [data.entries]);

  const rails = useMemo(() => {
    const by = (s: Status) => data.entries.filter((e) => e.status === s);
    return {
      current: by("current"),
      backlog: by("backlog"),
      hype: by("hype"),
      completed: by("completed").sort((a, b) =>
        (b.completedAt ?? "").localeCompare(a.completedAt ?? ""),
      ),
    };
  }, [data.entries]);

  return (
    <div className="space-y-10">
      <CelebrationModal game={celebrated} onClose={() => setCelebrated(null)} />
      <CelebrationModal game={reviewed} review onClose={() => setReviewed(null)} />
      <div className="space-y-6">
        <SectionTitle title="المكتبة" subtitle={`${num(list.length)} لعبة`} />

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
          tab === "completed" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {list.map((e) => (
                <div key={e.id} className="relative">
                  <CompletedCard entry={e} onOpen={() => setReviewed(e)} />
                  <GameEditDialog
                    entry={e}
                    onCompleted={(done) => setCelebrated(done)}
                    trigger={
                      <Button
                        size="icon"
                        variant="secondary"
                        className="absolute left-3 top-3 size-9 rounded-full"
                      >
                        <Pencil className="size-4" />
                      </Button>
                    }
                  />
                </div>
              ))}
            </div>
          ) : tab === "all" ? (
            <div className="space-y-8">
              {!!rails.current.length && (
                <Rail title="مواصلة اللعب" subtitle="ألعابك النشطة">
                  {rails.current.map((e, i) => (
                    <RailCard key={e.id} entry={e} index={i} vip />
                  ))}
                </Rail>
              )}
              {!!rails.backlog.length && (
                <Rail title="ناوي أختمها" subtitle="قائمة الانتظار">
                  {rails.backlog.map((e, i) => (
                    <RailCard key={e.id} entry={e} index={i} />
                  ))}
                </Rail>
              )}
              {!!rails.hype.length && (
                <Rail title="المرتقبة" subtitle="إصدارات قادمة">
                  {rails.hype.map((e, i) => (
                    <RailCard key={e.id} entry={e} index={i} />
                  ))}
                </Rail>
              )}
              {!!rails.completed.length && (
                <Rail title="قاعة الألعاب المكتملة" subtitle="إنجازاتك">
                  {rails.completed.map((e, i) => (
                    <TrophyRailCard key={e.id} entry={e} index={i} onOpen={() => setReviewed(e)} />
                  ))}
                </Rail>
              )}
            </div>
          ) : (
            <Rail title="قيد اللعب" subtitle={`${num(list.length)} لعبة`}>
              {list.map((e, i) => (
                <RailCard key={e.id} entry={e} index={i} vip />
              ))}
            </Rail>
          )
        ) : (

          <EmptyState text="لا توجد ألعاب هنا بعد." />
        )}
      </div>


      <div>
        <SectionTitle title="السلاسل" subtitle="تقدمك في كل سلسلة مع اقتراح الجزء التالي" />
        {franchises.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {franchises.map((f) => (
              <Link
                key={f.name}
                to="/franchise/$name"
                params={{ name: f.name }}
                className="block rounded-3xl border border-border bg-card p-4 surface-hover"
              >
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
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState text="أضف ألعابًا من سلاسل معروفة لتظهر هنا." />
        )}
      </div>
    </div>
  );
}
