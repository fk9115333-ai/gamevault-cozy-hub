import { createFileRoute } from "@tanstack/react-router";
import { useCurrentData } from "@/lib/store";
import { COLLECTIONS, FRANCHISES } from "@/lib/stats";
import { GameCard } from "@/components/GameCard";
import { EmptyState, SectionTitle } from "@/components/ui-bits";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { num } from "@/lib/dates";

export const Route = createFileRoute("/collections")({
  head: () => ({
    meta: [
      { title: "المجموعات والسلاسل — GameHub" },
      { name: "description", content: "تصفح ألعابك حسب المجموعات الذكية والسلاسل الشهيرة." },
      { property: "og:title", content: "المجموعات والسلاسل — GameHub" },
      { property: "og:description", content: "مجموعات تتحدث تلقائيًا وتتبع كامل للسلاسل." },
    ],
  }),
  component: CollectionsPage,
});

function CollectionsPage() {
  const data = useCurrentData();
  const [active, setActive] = useState(COLLECTIONS[0]!.name);
  const collection = COLLECTIONS.find((c) => c.name === active)!;
  const games = data.entries.filter(collection.match);

  const franchises = FRANCHISES.map((f) => {
    const items = data.entries.filter((e) => new RegExp(f, "i").test(e.name));
    const done = items.filter((e) => e.status === "completed");
    return {
      name: f,
      total: items.length,
      done: done.length,
      hours: items.reduce((s, e) => s + e.hours, 0),
      pct: items.length ? (done.length / items.length) * 100 : 0,
    };
  }).filter((f) => f.total > 0);

  return (
    <div className="space-y-8">
      <div>
        <SectionTitle title="المجموعات" subtitle="تُحدَّث تلقائيًا حسب تصنيفات الألعاب" />
        <div className="mb-4 flex flex-wrap gap-2">
          {COLLECTIONS.map((c) => (
            <Button
              key={c.name}
              size="sm"
              variant={active === c.name ? "default" : "secondary"}
              className="rounded-xl"
              onClick={() => setActive(c.name)}
            >
              {c.name} ({num(data.entries.filter(c.match).length)})
            </Button>
          ))}
        </div>
        {games.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {games.map((e, i) => (
              <GameCard key={e.id} entry={e} index={i} />
            ))}
          </div>
        ) : (
          <EmptyState text="لا توجد ألعاب في هذه المجموعة." />
        )}
      </div>

      <div>
        <SectionTitle title="السلاسل" subtitle="تقدمك في كل سلسلة" />
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
