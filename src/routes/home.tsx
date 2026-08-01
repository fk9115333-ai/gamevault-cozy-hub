import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  Gamepad2,
  CheckCircle2,
  Clock3,
  CalendarClock,
  Timer,
  Shuffle,
  Sparkles,
} from "lucide-react";
import { useCurrentData, useOtherData } from "@/lib/store";
import {
  computeStats,
  activityIcon,
  gameOfMonth,
  memoryBox,
  recommendation,
} from "@/lib/stats";
import { hijri, num } from "@/lib/dates";
import { GameCard } from "@/components/GameCard";
import { StatCard, SectionTitle, EmptyState } from "@/components/ui-bits";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — GameHub" },
      {
        name: "description",
        content: "نظرة شاملة على مكتبتك: قيد اللعب، المكتملة، المرتقبة، لعبة الشهر وذكرياتك.",
      },
      { property: "og:title", content: "لوحة التحكم — GameHub" },
      { property: "og:description", content: "نظرة شاملة على حياتك في عالم الألعاب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useCurrentData();
  const stats = computeStats(data.entries);
  const hero = data.entries.filter((e) => e.status === "current")[0] ?? null;
  const lastCompleted = data.entries
    .filter((e) => e.status === "completed" && e.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  const recent = [...data.entries].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 6);

  const other = useOtherData();
  const brotherActivity = other.activities[0] ?? null;
  const nextRelease = [...data.entries]
    .filter((e) => e.status === "hype" && e.released)
    .sort((a, b) => (a.released ?? "").localeCompare(b.released ?? ""))[0];

  const gotm = gameOfMonth(data.entries);
  const memories = memoryBox(data.entries);
  const rec = recommendation(data.entries);

  const pickRandom = () => {
    const pool = data.entries.filter((e) => e.status !== "completed" && e.status !== "hype");
    if (!pool.length) {
      toast("أضف ألعابًا أولًا");
      return;
    }
    toast.success(`اللعبة المختارة: ${pool[Math.floor(Math.random() * pool.length)]!.name}`);
  };

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[2rem] border border-border"
      >
        {hero?.image && (
          <img
            src={hero.image}
            alt={hero.name}
            className="absolute inset-0 size-full object-cover opacity-30"
          />
        )}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative flex flex-col gap-6 p-6 md:p-10">
          <div>
            <p className="text-sm text-muted-foreground">أهلاً بعودتك</p>
            <h1 className="font-display text-3xl font-black md:text-5xl">
              مرحباً <span className="gradient-text">{data.profile.name}</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">{data.profile.bio}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {hero ? (
              <Link
                to="/game/$id"
                params={{ id: String(hero.id) }}
                className="flex items-center gap-3 rounded-2xl glass px-4 py-3"
              >
                <span className="text-xs text-muted-foreground">تلعب الآن</span>
                <span className="font-display text-sm font-bold">{hero.name}</span>
                <span className="text-xs text-primary">{num(hero.hours, 1)} ساعة</span>
              </Link>
            ) : (
              <span className="rounded-2xl glass px-4 py-3 text-sm text-muted-foreground">
                لا توجد ألعاب قيد اللعب حالياً
              </span>
            )}
            {lastCompleted && (
              <div className="rounded-2xl glass px-4 py-3 text-sm">
                <span className="text-xs text-muted-foreground">آخر إنجاز: </span>
                <span className="font-bold">{lastCompleted.name}</span>
              </div>
            )}
            <Button onClick={pickRandom} variant="secondary" className="rounded-2xl">
              <Shuffle className="size-4" /> اختر لي لعبة
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="space-y-3">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="كل الألعاب" value={stats.total} icon={Gamepad2} index={0} />
          <StatCard label="مكتملة" value={stats.completed} icon={CheckCircle2} index={1} />
          <StatCard label="قيد اللعب" value={stats.current} icon={Clock3} index={2} />
          <StatCard label="الانتظار" value={stats.backlog + stats.next} icon={CalendarClock} index={3} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.45 }}
          className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6"
        >
          <div className="absolute inset-0 opacity-40" style={{ background: "var(--gradient-hero)" }} />
          <div className="relative flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">ساعات اللعب</p>
              <p className="font-display text-4xl font-black md:text-5xl">{num(stats.hours, 1)}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                بمعدل {num(stats.avgDailyHours, 1)} ساعة يوميًا
              </p>
            </div>
            <span className="grid size-14 place-items-center rounded-3xl bg-secondary/70 text-primary">
              <Timer className="size-6" />
            </span>
          </div>
        </motion.div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {gotm && (
          <Link
            to="/game/$id"
            params={{ id: String(gotm.game.id) }}
            className="relative overflow-hidden rounded-[2rem] border border-border p-6 surface-hover"
          >
            {gotm.game.image && (
              <img
                src={gotm.game.image}
                alt={gotm.game.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-25"
              />
            )}
            <div className="relative">
              <p className="text-xs text-muted-foreground">🏅 لعبة الشهر</p>
              <h3 className="font-display text-2xl font-extrabold">{gotm.game.name}</h3>
              <p className="text-xs text-primary">{num(gotm.hours, 1)} ساعة هذا الشهر</p>
            </div>
          </Link>
        )}

        {rec && (
          <div className="rounded-[2rem] border border-border bg-card p-6">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" /> لو كنت مكانك
            </p>
            <Link
              to="/game/$id"
              params={{ id: String(rec.game.id) }}
              className="font-display text-2xl font-extrabold hover:text-primary"
            >
              {rec.game.name}
            </Link>
            <p className="mt-1 text-xs text-muted-foreground">{rec.reason}</p>
          </div>
        )}
      </section>

      {memories.length > 0 && (
        <section className="rounded-[2rem] border border-border bg-card p-6">
          <p className="mb-3 text-xs text-muted-foreground">📦 صندوق الذكريات</p>
          <div className="space-y-2">
            {memories.map((m) => (
              <Link
                key={m.text}
                to="/game/$id"
                params={{ id: String(m.game.id) }}
                className="block rounded-2xl bg-secondary/50 px-4 py-3 text-sm surface-hover"
              >
                {m.text}
              </Link>
            ))}
          </div>
        </section>
      )}

      <Link
        to="/timeline"
        className="flex items-center gap-3 overflow-hidden rounded-3xl border border-border bg-card px-5 py-4 surface-hover"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-secondary text-lg">
          {other.profile.avatar}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground">نشاطات {other.profile.name}</p>
          {brotherActivity ? (
            <p className="truncate text-sm font-semibold">
              {activityIcon(brotherActivity.type)} {other.profile.name} {brotherActivity.text}
            </p>
          ) : (
            <p className="truncate text-sm text-muted-foreground">لا نشاط بعد</p>
          )}
        </div>
        {brotherActivity && (
          <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">
            {hijri(brotherActivity.at)}
          </span>
        )}
      </Link>

      {nextRelease && (
        <section className="relative overflow-hidden rounded-[2rem] border border-border p-6">
          {nextRelease.image && (
            <img
              src={nextRelease.image}
              alt={nextRelease.name}
              className="absolute inset-0 size-full object-cover opacity-25"
            />
          )}
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">أقرب لعبة في قائمة الحماس</p>
              <h3 className="font-display text-2xl font-extrabold">{nextRelease.name}</h3>
              <p className="text-xs text-muted-foreground">{hijri(nextRelease.released)}</p>
            </div>
            <Countdown target={nextRelease.released} />
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionTitle
            title="أُضيفت مؤخرًا"
            subtitle="آخر الألعاب في مكتبتك"
            action={
              <Link to="/library" className="text-xs text-primary">
                عرض الكل
              </Link>
            }
          />
          {recent.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {recent.map((e, i) => (
                <GameCard key={e.id} entry={e} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState text="لا توجد ألعاب بعد — استخدم البحث الذكي في الأعلى." />
          )}
        </div>

        <div className="space-y-6">
          <div>
            <SectionTitle
              title="الخط الزمني"
              action={
                <Link to="/timeline" className="text-xs text-primary">
                  الكل
                </Link>
              }
            />
            <div className="space-y-2 rounded-3xl border border-border bg-card p-3">
              {data.activities.length ? (
                data.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-2xl p-2 text-sm">
                    <span>{activityIcon(a.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground">{hijri(a.at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-xs text-muted-foreground">لا نشاط بعد</p>
              )}
            </div>
          </div>

          <div>
            <SectionTitle title="الأهداف" />
            <div className="space-y-3 rounded-3xl border border-border bg-card p-4">
              {data.goals.map((g) => {
                const value =
                  g.unit === "لعبة" ? stats.completed : g.unit === "ساعة" ? stats.hours : g.current;
                const pct = Math.min(100, (value / g.target) * 100);
                return (
                  <div key={g.id}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span>{g.title}</span>
                      <span className="text-muted-foreground">
                        {num(value)} / {num(g.target)}
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        className="h-full rounded-full bg-[var(--gradient-accent)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
