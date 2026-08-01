import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCurrentData, useStore } from "@/lib/store";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { Countdown } from "@/components/Countdown";
import { GameCard } from "@/components/GameCard";
import { gregorian, hijri } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/upcoming")({
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
  const data = useCurrentData();
  const removeGame = useStore((s) => s.removeGame);
  const reorderQueue = useStore((s) => s.reorderQueue);
  const [tab, setTab] = useState<(typeof topTabs)[number]["v"]>("releases");
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
    <div className="space-y-6">
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
          <div className="space-y-6">
            {releases.map((g, i) => (
              <motion.article
                key={g.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.06, 0.4) }}
                className="relative overflow-hidden rounded-[2rem] border border-border"
              >
                {g.image && (
                  <img
                    src={g.image}
                    alt={g.name}
                    loading="lazy"
                    className="absolute inset-0 size-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
                <div className="relative flex flex-col gap-5 p-6 pt-40 md:p-10 md:pt-56">
                  <div>
                    <Link to="/game/$id" params={{ id: String(g.id) }}>
                      <h3 className="font-display text-3xl font-black md:text-4xl">{g.name}</h3>
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {gregorian(g.released)} · {hijri(g.released)}
                    </p>
                  </div>
                  <Countdown target={g.released} size="lg" />
                  <div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-xl"
                      onClick={() => {
                        buzz(30);
                        removeGame(g.id);
                        toast("أُزيلت من المرتقبة");
                      }}
                    >
                      <Trash2 className="size-3.5" /> إزالة
                    </Button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <EmptyState text="لا توجد إصدارات مرتقبة — ابحث عن لعبة وأضفها إلى «المرتقبة»." />
        )
      ) : toBeat.length ? (
        <div className="space-y-4">
          {toBeat.length > 1 && (
            <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              ⠿ اسحب البطاقات لترتيب أولوياتك — أو استخدم الأسهم على الجوال. الترتيب يُحفظ ويُزامن
              تلقائيًا.
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {toBeat.map((e, i) => (
              <div
                key={e.id}
                className="relative"
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
              >
                <GameCard entry={e} index={i} draggable />
                <div className="absolute bottom-3 left-3 flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-8 rounded-full"
                    aria-label="أعلى"
                    onClick={() => move(i, i - 1)}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-8 rounded-full"
                    aria-label="أسفل"
                    onClick={() => move(i, i + 1)}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState text="ما فيه ألعاب في «ناوي أختمها» — أضف ألعابًا إلى قائمتك." />
      )}
    </div>
  );
}
