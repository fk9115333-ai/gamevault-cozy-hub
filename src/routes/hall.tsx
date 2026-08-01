import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useCurrentData } from "@/lib/store";
import { num } from "@/lib/dates";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { Trophy, Star } from "lucide-react";

export const Route = createFileRoute("/hall")({
  head: () => ({
    meta: [
      { title: "أفضل 10 ألعاب — GameHub" },
      {
        name: "description",
        content: "ترتيب أفضل 10 ألعاب لعبتها حسب تقييمك الشخصي، من الأول إلى العاشر.",
      },
      { property: "og:title", content: "أفضل 10 ألعاب — GameHub" },
      { property: "og:description", content: "قائمة مرتّبة لأفضل ما لعبته." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TopTenPage,
});

function TopTenPage() {
  const data = useCurrentData();
  const games = [...data.entries]
    .filter((e) => e.personalRating > 0)
    .sort((a, b) => b.personalRating - a.personalRating || b.hours - a.hours)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-border p-6 text-center">
        <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative space-y-2">
          <Trophy className="mx-auto size-9 text-accent" />
          <h1 className="font-display text-3xl font-black md:text-4xl">أفضل 10 ألعاب</h1>
          <p className="text-sm text-muted-foreground">مرتّبة حسب تقييمك الشخصي</p>
        </div>
      </div>

      <SectionTitle title="الترتيب" subtitle="من 1 إلى 10" />

      {games.length ? (
        <div className="space-y-3">
          {games.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
            >
              <Link
                to="/game/$id"
                params={{ id: String(g.id) }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 surface-hover"
              >
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl font-display text-lg font-black ${
                    i === 0
                      ? "bg-[var(--gradient-primary)] text-primary-foreground"
                      : "bg-secondary text-primary"
                  }`}
                >
                  {i + 1}
                </span>
                {g.image && (
                  <img
                    src={g.image}
                    alt={g.name}
                    loading="lazy"
                    className="size-16 shrink-0 rounded-xl object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{g.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {num(g.hours, 1)} ساعة{g.fullCompletion ? " · 🏆 بلاتينيوم" : ""}
                    {g.coop ? " · 🎮🎮 سوا" : ""}
                  </p>
                </div>
                <span className="flex shrink-0 items-center gap-1 font-display font-black text-primary">
                  <Star className="size-4 fill-current" />
                  {g.personalRating}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState text="قيّم ألعابك لتظهر هنا قائمة أفضل 10." />
      )}
    </div>
  );
}
