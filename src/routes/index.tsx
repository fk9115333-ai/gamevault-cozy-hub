import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import {
  Gamepad2,
  CheckCircle2,
  Clock3,
  ListTodo,
  Heart,
  Star,
  Timer,
  Sparkles,
  Shuffle,
  Trophy,
} from "lucide-react";
import { useCurrentData, useStore } from "@/lib/store";
import { computeStats, computeAchievements, activityIcon } from "@/lib/stats";
import { getUpcoming } from "@/lib/rawg";
import { gregorian, hijri, num } from "@/lib/dates";
import { GameCard } from "@/components/GameCard";
import { StatCard, SectionTitle, EmptyState } from "@/components/ui-bits";
import { Countdown } from "@/components/Countdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GameHub — لوحة التحكم" },
      { name: "description", content: "نظرة شاملة على مكتبتك: قيد اللعب، المكتملة، القادمة، والإحصائيات." },
      { property: "og:title", content: "GameHub — لوحة التحكم" },
      { property: "og:description", content: "نظرة شاملة على حياتك في عالم الألعاب." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useCurrentData();
  const userName = data.profile.name;
  const stats = computeStats(data.entries);
  const achievements = computeAchievements(data.entries).filter((a) => a.unlocked).slice(0, 4);
  const current = data.entries.filter((e) => e.status === "current");
  const hero = current[0] ?? data.entries[0];
  const lastCompleted = data.entries
    .filter((e) => e.status === "completed" && e.completedAt)
    .sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""))[0];
  const recent = [...data.entries].sort((a, b) => b.addedAt.localeCompare(a.addedAt)).slice(0, 8);

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming-mini"],
    queryFn: getUpcoming,
    staleTime: 1000 * 60 * 60,
  });
  const nextRelease = upcoming?.[0];

  const pickRandom = () => {
    const pool = data.entries.filter((e) => e.status !== "completed");
    if (!pool.length) {
      toast("أضف ألعابًا أولًا");
      return;
    }
    const pick = pool[Math.floor(Math.random() * pool.length)]!;
    toast.success(`اللعبة المختارة: ${pick.name}`);
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
        <div
          className="absolute inset-0"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="relative flex flex-col gap-6 p-6 md:p-10">
          <div>
            <p className="text-sm text-muted-foreground">أهلاً بعودتك</p>
            <h1 className="font-display text-3xl font-black md:text-5xl">
              {userName} <span className="gradient-text">— GameHub</span>
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
                <span className="text-xs text-primary">{hero.progress}%</span>
              </Link>
            ) : (
              <span className="rounded-2xl glass px-4 py-3 text-sm text-muted-foreground">
                ابحث عن لعبة وأضفها لتبدأ
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

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="كل الألعاب" value={stats.total} icon={Gamepad2} index={0} />
        <StatCard label="مكتملة" value={stats.completed} icon={CheckCircle2} index={1} />
        <StatCard label="قيد اللعب" value={stats.current} icon={Clock3} index={2} />
        <StatCard label="الانتظار" value={stats.backlog} icon={ListTodo} index={3} />
        <StatCard label="الرغبات" value={stats.wishlist} icon={Sparkles} index={4} />
        <StatCard label="المفضلة" value={stats.favorites} icon={Heart} index={5} />
        <StatCard label="ساعات اللعب" value={stats.hours} icon={Timer} index={6} />
        <StatCard label="متوسط التقييم" value={stats.avgRating} icon={Star} index={7} />
      </section>

      {nextRelease && (
        <section className="relative overflow-hidden rounded-[2rem] border border-border p-6">
          {nextRelease.background_image && (
            <img
              src={nextRelease.background_image}
              alt={nextRelease.name}
              className="absolute inset-0 size-full object-cover opacity-25"
            />
          )}
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground">العد التنازلي للإصدار القادم</p>
              <h3 className="font-display text-2xl font-extrabold">{nextRelease.name}</h3>
              <p className="text-xs text-muted-foreground">
                {gregorian(nextRelease.released)} · {hijri(nextRelease.released)}
              </p>
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
            <SectionTitle title="آخر النشاطات" />
            <div className="space-y-2 rounded-3xl border border-border bg-card p-3">
              {data.activities.length ? (
                data.activities.slice(0, 8).map((a) => (
                  <div key={a.id} className="flex items-start gap-3 rounded-2xl p-2 text-sm">
                    <span>{activityIcon(a.type)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate">{a.text}</p>
                      <p className="text-[11px] text-muted-foreground">{gregorian(a.at)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="p-4 text-center text-xs text-muted-foreground">لا نشاط بعد</p>
              )}
            </div>
          </div>

          <div>
            <SectionTitle
              title="آخر الإنجازات"
              action={
                <Link to="/achievements" className="text-xs text-primary">
                  الكل
                </Link>
              }
            />
            <div className="grid grid-cols-2 gap-2">
              {achievements.length ? (
                achievements.map((a) => (
                  <div key={a.id} className="rounded-2xl border border-border bg-card p-3">
                    <p className="text-2xl">{a.icon}</p>
                    <p className="mt-1 text-xs font-bold">{a.title}</p>
                  </div>
                ))
              ) : (
                <p className="col-span-2 rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  لا إنجازات بعد
                </p>
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

      <section className="grid gap-3 sm:grid-cols-3">
        <QuickAction to="/library" icon={<Gamepad2 className="size-4" />} label="إدارة المكتبة" />
        <QuickAction to="/stats" icon={<Star className="size-4" />} label="الإحصائيات" />
        <QuickAction to="/achievements" icon={<Trophy className="size-4" />} label="الإنجازات" />
      </section>
    </div>
  );
}

function QuickAction({
  to,
  icon,
  label,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
}) {
  const setUser = useStore((s) => s.setUser);
  void setUser;
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-sm font-semibold surface-hover"
    >
      <span className="grid size-9 place-items-center rounded-xl bg-secondary text-primary">
        {icon}
      </span>
      {label}
    </Link>
  );
}
