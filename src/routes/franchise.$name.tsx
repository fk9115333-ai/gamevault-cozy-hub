import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useCurrentData } from "@/lib/store";
import { franchiseTimeline } from "@/lib/stats";
import { num } from "@/lib/dates";
import { EmptyState, SectionTitle } from "@/components/ui-bits";

export const Route = createFileRoute("/franchise/$name")({
  head: ({ params }) => ({
    meta: [
      { title: `سلسلة ${params.name} — GameHub` },
      {
        name: "description",
        content: `خط زمني كامل لسلسلة ${params.name} مع حالة كل جزء ونسبة إكمالك للسلسلة.`,
      },
      { property: "og:title", content: `سلسلة ${params.name} — GameHub` },
      { property: "og:description", content: `تتبع تقدمك في سلسلة ${params.name}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FranchisePage,
});

const stateIcon = { done: "✅", playing: "⏳", none: "⬜" } as const;

function FranchisePage() {
  const { name } = Route.useParams();
  const data = useCurrentData();
  const f = franchiseTimeline(name, data.entries);

  if (!f) return <EmptyState text="لم نتعرف على هذه السلسلة." />;

  return (
    <div className="space-y-6">
      <SectionTitle title={`سلسلة ${f.name}`} subtitle="خط زمني كامل للسلسلة" />

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-bold">إكمال السلسلة</span>
          <span className="text-muted-foreground">{num(f.pct)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-secondary">
          <motion.div
            className="h-full rounded-full bg-[var(--gradient-primary)]"
            initial={{ width: 0 }}
            animate={{ width: `${f.pct}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
      </div>

      <div className="relative space-y-3 pr-5">
        <span className="absolute inset-y-0 right-2 w-px bg-border" />
        {f.items.map((item, i) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5) }}
            className="relative flex items-center gap-4 rounded-3xl border border-border bg-card p-4"
          >
            <span className="absolute -right-[19px] top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded-full border-2 border-background bg-primary" />
            <span className="text-lg">{stateIcon[item.state]}</span>
            {item.entry?.image && (
              <img
                src={item.entry.image}
                alt={item.title}
                loading="lazy"
                className="size-14 shrink-0 rounded-2xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              {item.entry ? (
                <Link
                  to="/game/$id"
                  params={{ id: String(item.entry.id) }}
                  className="truncate font-display font-bold hover:text-primary"
                >
                  {item.title}
                </Link>
              ) : (
                <p className="truncate font-display font-bold text-muted-foreground">{item.title}</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {item.state === "done"
                  ? `مكتملة · ${num(item.entry?.hours ?? 0, 1)} ساعة`
                  : item.state === "playing"
                    ? "قيد اللعب"
                    : "لم تبدأ بعد"}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
