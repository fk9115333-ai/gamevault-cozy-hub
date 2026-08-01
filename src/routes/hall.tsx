import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useCurrentData } from "@/lib/store";
import { hallBadge, hallOfFameGames } from "@/lib/stats";
import { num } from "@/lib/dates";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { Crown, Star } from "lucide-react";

export const Route = createFileRoute("/hall")({
  head: () => ({
    meta: [
      { title: "قاعة المشاهير — GameHub" },
      {
        name: "description",
        content: "أساطيرك الشخصية: الألعاب التي حصلت على 9.5 فما فوق بشاراتها وساعاتها.",
      },
      { property: "og:title", content: "قاعة المشاهير — GameHub" },
      { property: "og:description", content: "أفضل ما لعبته على الإطلاق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HallPage,
});

function HallPage() {
  const data = useCurrentData();
  const games = hallOfFameGames(data.entries);
  const hours = games.reduce((s, e) => s + e.hours, 0);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-border p-8 text-center">
        <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative space-y-2">
          <Crown className="mx-auto size-10 text-accent" />
          <h1 className="font-display text-3xl font-black md:text-4xl">قاعة المشاهير</h1>
          <p className="text-sm text-muted-foreground">
            {num(games.length)} لعبة أسطورية · {num(hours, 1)} ساعة
          </p>
        </div>
      </div>

      <SectionTitle title="الأساطير" subtitle="تقييم 9.5+ أو مُختارة يدويًا" />

      {games.length ? (
        <div className="grid gap-5 md:grid-cols-2">
          {games.map((g, i) => (
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.5) }}
              className="relative overflow-hidden rounded-[2rem] border border-accent/30"
            >
              {g.image && (
                <img
                  src={g.image}
                  alt={g.name}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/30" />
              <div className="relative flex flex-col gap-3 p-6 pt-32">
                <span className="w-fit rounded-full bg-accent/20 px-3 py-1 text-[11px] font-bold text-accent">
                  {hallBadge(g)}
                </span>
                <Link to="/game/$id" params={{ id: String(g.id) }}>
                  <h3 className="font-display text-2xl font-black">{g.name}</h3>
                </Link>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-accent">
                    <Star className="size-3.5 fill-current" /> {g.personalRating}/10
                  </span>
                  <span>{num(g.hours, 1)} ساعة</span>
                  {g.fullCompletion && <span>🏆 بلاتينيوم</span>}
                  {g.coop && <span>🎮🎮 سوا</span>}
                </div>
                {g.review && <p className="text-xs text-muted-foreground">{g.review}</p>}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <EmptyState text="لا توجد أساطير بعد — قيّم لعبة 9.5+ أو فعّل «قاعة المشاهير» في نافذة التتبع." />
      )}
    </div>
  );
}
