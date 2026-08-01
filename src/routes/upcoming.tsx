import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentData, useStore } from "@/lib/store";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { Countdown } from "@/components/Countdown";
import { gregorian, hijri, num } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Trash2, ChevronDown, ChevronUp, GripVertical, Star } from "lucide-react";

export const Route = createFileRoute("/upcoming")({
  validateSearch: (search: Record<string, unknown>) => ({
    tab: search['tab'] === "toBeat" ? ("toBeat" as const) : ("releases" as const),
  }),
  head: () => ({
    meta: [
      { title: "الخطة — GameHub" },
      {
        name: "description",
        content: "إصدارات مرتقبة بعدّاد تنازلي حيّ، وقائمة «ناوي أختمها» بترتيبك الخاص.",
      },
      { property: "og:title", content: "الخطة — GameHub" },
      { property: "og:description", content: "خطتك القادمة: الإصدارات المرتقبة والألعاب التي تنوي ختمها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlanPage,
});

const topTabs = [
  { v: "releases", l: "إصدارات مرتقبة" },
  { v: "toBeat", l: "ناوي أختمها" },
] as const;

function PlanPage() {
  const { tab: initialTab } = Route.useSearch();
  const data = useCurrentData();
  const removeGame = useStore((s) => s.removeGame);
  const reorderQueue = useStore((s) => s.reorderQueue);
  const [tab, setTab] = useState<(typeof topTabs)[number]["v"]>(initialTab);
  const [dragId, setDragId] = useState<number | null>(null);


  const releases = [...data.entries]
    .filter((e) => e.status === "hype")
    .sort((a, b) => (a.released ?? "9999").localeCompare(b.released ?? "9999"));

  const toBeat = [...data.entries]
    .filter((e) => e.status === "backlog")
    .sort(
      (a, b) => (a.queuePosition || 999) - (b.queuePosition || 999) || a.name.localeCompare(b.name),
    );

  const move = (from: number, to: number) => {
    if (to < 0 || to >= toBeat.length || from === to || from < 0) return;
    const ids = toBeat.map((e) => e.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    buzz(20);
    reorderQueue(ids);
  };

  return (
    <div className="space-y-5">
      <SectionTitle title="الخطة" subtitle="ما ينتظرك قريبًا، وما نويت تختمه بعد لعبتك الحالية" />

      <div className="flex gap-2 rounded-2xl bg-secondary/50 p-1">
        {topTabs.map((t) => (
          <Button
            key={t.v}
            size="sm"
            variant={tab === t.v ? "default" : "ghost"}
            className="flex-1 rounded-xl"
            onClick={() => setTab(t.v)}
          >
            {t.l}
          </Button>
        ))}
      </div>

      {tab === "releases" ? (
        releases.length ? (
          <div className="space-y-4">
            {releases.map((g, i) => (
              <motion.article
                key={g.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.4) }}
                className="overflow-hidden rounded-[1.75rem] border border-border bg-card"
              >
                {/* الغلاف بنسبة عرضية ثابتة — بلا أي تراكب على النص */}
                <Link
                  to="/game/$id"
                  params={{ id: String(g.id) }}
                  className="block aspect-[16/9] w-full overflow-hidden bg-secondary"
                >
                  {g.image ? (
                    <img
                      src={g.image}
                      alt={g.name}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : null}
                </Link>

                <div className="flex flex-col gap-3 p-4">
                  <div className="min-w-0">
                    <Link to="/game/$id" params={{ id: String(g.id) }}>
                      <h3 className="break-words font-display text-xl font-black leading-tight md:text-2xl">
                        {g.name}
                      </h3>
                    </Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {gregorian(g.released)} · {hijri(g.released)}
                    </p>
                  </div>

                  <Countdown target={g.released} />

                  <Button
                    size="sm"
                    variant="secondary"
                    className="w-fit rounded-xl"
                    onClick={() => {
                      buzz(30);
                      removeGame(g.id);
                      toast("أُزيلت من المرتقبة");
                    }}
                  >
                    <Trash2 className="size-3.5" /> إزالة
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <EmptyState text="لا توجد إصدارات مرتقبة — ابحث عن لعبة وأضفها إلى «المرتقبة»." />
        )
      ) : toBeat.length ? (
        <div className="space-y-3">
          {toBeat.length > 1 && (
            <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              ⠿ اسحب البطاقات لترتيب أولوياتك — أو استخدم الأسهم على الجوال. الترتيب يُحفظ ويُزامن
              تلقائيًا.
            </p>
          )}

          {toBeat.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.35) }}
              draggable
              onDragStart={() => setDragId(e.id)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => {
                if (dragId === null) return;
                move(
                  toBeat.findIndex((x) => x.id === dragId),
                  i,
                );
                setDragId(null);
              }}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 surface-hover"
            >
              <span className="grid size-9 shrink-0 cursor-grab place-items-center rounded-xl bg-secondary text-xs font-black text-primary">
                {i + 1}
              </span>

              <Link
                to="/game/$id"
                params={{ id: String(e.id) }}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                {e.image && (
                  <img
                    src={e.image}
                    alt={e.name}
                    loading="lazy"
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{e.name}</p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {e.genres[0] ?? "لعبة"}
                    {e.playtimeEstimate ? ` · ~${num(e.playtimeEstimate)} ساعة` : ""}
                    {e.metacritic ? ` · ميتاكريتك ${e.metacritic}` : ""}
                  </p>
                </div>
                {e.rating > 0 && (
                  <span className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
                    <Star className="size-3.5 text-primary" />
                    {num(e.rating, 1)}
                  </span>
                )}
              </Link>

              <div className="flex shrink-0 flex-col gap-1">
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-7 rounded-full"
                  aria-label="أعلى"
                  onClick={() => move(i, i - 1)}
                >
                  <ChevronUp className="size-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="size-7 rounded-full"
                  aria-label="أسفل"
                  onClick={() => move(i, i + 1)}
                >
                  <ChevronDown className="size-4" />
                </Button>
              </div>
              <GripVertical className="size-4 shrink-0 text-muted-foreground" />
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState text="ما فيه ألعاب في «ناوي أختمها» — أضف لعبة واختر حالة «الانتظار»." />
      )}
    </div>
  );
}
