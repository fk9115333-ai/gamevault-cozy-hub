import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Crown,
  Sparkles,
  Timer,
  PlayCircle,
  Activity as ActivityIcon,
  Newspaper,
  ExternalLink,
  Trophy,
  Zap,
  Clock,
  Plus,
} from "lucide-react";
import { useCurrentData, useOtherData, useStore } from "@/lib/store";
import { activityIcon, gameOfMonth, memoryBox, computeStats, computeLevel } from "@/lib/stats";
import { hijri, num } from "@/lib/dates";
import { SectionTitle } from "@/components/ui-bits";
import { LogSessionSheet } from "@/components/GameEditDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { getGamingNews } from "@/lib/news.functions";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية — GameHub" },
      {
        name: "description",
        content: "مواصلة اللعب، نبض الألعاب، أخبار الجيمرز، لعبة الشهر وصندوق الذكريات.",
      },
      { property: "og:title", content: "الرئيسية — GameHub" },
      { property: "og:description", content: "قلب GameHub الاجتماعي والتفاعلي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const data = useCurrentData();
  const other = useOtherData();
  const users = useStore((s) => s.users);
  const currentUser = useStore((s) => s.currentUser);

  const hero = data.entries.find((e) => e.status === "current") ?? null;
  const gotm = gameOfMonth(data.entries);
  const memories = memoryBox(data.entries);
  const stats = computeStats(data.entries);
  const { level } = computeLevel(data.entries);

  const fetchNews = useServerFn(getGamingNews);
  const news = useQuery({
    queryKey: ["gaming-news"],
    queryFn: () => fetchNews(),
    staleTime: 10 * 60 * 1000,
  });

  /** ساعات هذا الشهر من الجلسات المسجّلة */
  const monthHours = useMemo(() => {
    const key = new Date().toISOString().slice(0, 7);
    const mins = data.entries
      .flatMap((e) => e.sessions)
      .filter((s) => s.date?.startsWith(key))
      .reduce((sum, s) => sum + s.minutes, 0);
    return Math.round((mins / 60) * 10) / 10;
  }, [data.entries]);

  /** نبض الألعاب: نشاطات الأخوين مدمجة */
  const pulse = useMemo(() => {
    const tag = (uid: "faisal" | "mishal") =>
      users[uid].activities.map((a) => ({ ...a, who: users[uid].profile.name, avatar: users[uid].profile.avatar }));
    return [...tag("faisal"), ...tag("mishal")].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }, [users]);

  /** اقتراح اليوم: لعبة من «ناوي أختمها» */
  const suggestion = useMemo(() => {
    const pool = data.entries.filter((e) => e.status === "backlog");
    if (!pool.length) return null;
    const seed = new Date().getDate() + currentUser.length;
    return pool[seed % pool.length]!;
  }, [data.entries, currentUser]);

  const quick = [
    { icon: Trophy, label: "مكتملة", value: num(stats.completed) },
    { icon: Zap, label: "المستوى", value: num(level) },
    { icon: Clock, label: "ساعات الشهر", value: num(monthHours, 1) },
  ];

  return (
    <div className="space-y-5">
      {/* الترحيب + شريط الإحصائيات السريع */}
      <section className="space-y-3">
        <h1 className="font-display text-2xl font-black">مرحباً {data.profile.name}</h1>
        <div className="grid grid-cols-3 gap-2 rounded-3xl border border-border bg-card p-2">
          {quick.map((q) => (
            <div key={q.label} className="rounded-2xl bg-secondary/40 px-2 py-3 text-center">
              <q.icon className="mx-auto size-4 text-primary" />
              <p className="mt-1 font-display text-lg font-black gradient-text">{q.value}</p>
              <p className="text-[10px] text-muted-foreground">{q.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* A — مواصلة اللعب */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[2rem] border border-border"
      >
        {hero?.image && (
          <img src={hero.image} alt={hero.name} className="absolute inset-0 size-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative flex flex-col gap-3 p-5">
          {hero ? (
            <>
              <p className="text-xs text-muted-foreground">مواصلة اللعب</p>
              <Link to="/game/$id" params={{ id: String(hero.id) }}>
                <h2 className="font-display text-2xl font-black md:text-4xl">{hero.name}</h2>
              </Link>
              <p className="text-xs text-primary">{num(hero.hours, 1)} ساعة حتى الآن</p>
              <LogSessionSheet
                entry={hero}
                trigger={
                  <Button className="w-fit rounded-2xl bg-[var(--gradient-primary)] text-primary-foreground shadow-[0_0_25px_-6px_rgba(234,179,8,0.6)]">
                    <PlayCircle className="size-4" /> تسجيل جلسة
                  </Button>
                }
              />
            </>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">ما فيه لعبة قيد اللعب</p>
              <h2 className="font-display text-2xl font-black md:text-3xl">ابدأ رحلتك الجديدة اليوم</h2>
              <p className="text-xs text-muted-foreground">
                اختر لعبة من خطتك وحوّلها إلى «قيد اللعب» وابدأ العد.
              </p>
              <Link to="/upcoming">
                <Button className="w-fit rounded-2xl bg-[var(--gradient-primary)] text-primary-foreground shadow-[0_0_25px_-6px_rgba(234,179,8,0.6)]">
                  <Plus className="size-4" /> اختر لعبة من الخطة
                </Button>
              </Link>
            </>
          )}
        </div>
      </motion.section>

      {/* B — نبض الألعاب */}
      <section>
        <SectionTitle
          title="نبض الألعاب"
          subtitle="آخر نشاطاتكم"
          action={
            <Link to="/timeline" className="text-xs text-primary">
              الكل
            </Link>
          }
        />
        <div className="max-h-72 space-y-2 overflow-y-auto rounded-3xl border border-border bg-card p-3">
          {pulse.length ? (
            pulse.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-2xl bg-secondary/30 p-3 text-sm">
                <UserAvatar value={a.avatar} size={34} framed={false} />
                <div className="min-w-0 flex-1">
                  <p className="truncate">
                    {activityIcon(a.type)} <span className="font-bold">{a.who}</span> {a.text}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{hijri(a.at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-secondary/40 p-5 text-center">
              <ActivityIcon className="mx-auto size-5 text-primary" />
              <p className="mt-2 text-sm font-bold">التحدي يبدأ هنا..</p>
              <p className="mt-1 text-xs text-muted-foreground">
                أضف ألعابك وابدأ الختم مع {other.profile.name}!
              </p>
              <Link to="/library">
                <Button size="sm" variant="secondary" className="mt-3 rounded-xl">
                  <Plus className="size-3.5" /> أضف لعبة
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* C — أخبار الجيمرز */}
      <section>
        <SectionTitle
          title="أخبار الجيمرز"
          subtitle="آخر عناوين الألعاب بالعربي"
          action={
            <Link to="/news" className="text-xs text-primary">
              الكل
            </Link>
          }
        />
        <div className="space-y-2">
          {news.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-card" />
            ))
          ) : news.data?.length ? (
            news.data.slice(0, 4).map((n) => (
              <a
                key={n.id}
                href={n.link}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-3 rounded-2xl border border-border bg-card p-2.5 surface-hover"
              >
                {n.image ? (
                  <img src={n.image} alt="" loading="lazy" className="size-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="grid size-16 shrink-0 place-items-center rounded-xl bg-secondary">
                    <Newspaper className="size-5 text-primary" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-xs font-bold leading-snug">{n.title}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">{n.source}</p>
                </div>
                <ExternalLink className="size-4 shrink-0 text-primary" />
              </a>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              تعذّر جلب الأخبار الآن.
            </p>
          )}
        </div>
      </section>

      {/* D — لعبة الشهر */}
      <section>
        <SectionTitle title="لعبة الشهر" />
        {gotm ? (
          <Link
            to="/game/$id"
            params={{ id: String(gotm.game.id) }}
            className="relative block overflow-hidden rounded-[2rem] border-2 border-yellow-500/60 p-5 shadow-[0_0_25px_-8px_rgba(234,179,8,0.5)]"
          >
            {gotm.game.image && (
              <img
                src={gotm.game.image}
                alt={gotm.game.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-25"
              />
            )}
            <div className="relative flex items-center gap-4">
              <Crown className="size-8 gold-glow" />
              <div className="min-w-0">
                <h3 className="truncate font-display text-xl font-extrabold">{gotm.game.name}</h3>
                <p className="text-xs text-primary">{num(gotm.hours, 1)} ساعة هذا الشهر</p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            سجّل جلسات هذا الشهر لتظهر لعبة الشهر.
          </div>
        )}
      </section>

      {/* E — صندوق الذكريات */}
      <section>
        <SectionTitle title="صندوق الذكريات" />
        <div className="space-y-2 rounded-[2rem] border border-border bg-card p-3">
          {memories.length ? (
            memories.map((m) => (
              <Link
                key={m.text}
                to="/game/$id"
                params={{ id: String(m.game.id) }}
                className="block rounded-2xl bg-secondary/50 px-4 py-3 text-sm surface-hover"
              >
                {m.text}
              </Link>
            ))
          ) : (
            <p className="p-3 text-center text-xs text-muted-foreground">ذكرياتك تُبنى الآن...</p>
          )}
        </div>
      </section>

      {/* F — اقتراح اليوم */}
      <section>
        <SectionTitle title="اقتراح اليوم" />
        {suggestion ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-5">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 gold-glow" /> ليش ما تلعب هذي اليوم؟
            </p>
            <Link
              to="/game/$id"
              params={{ id: String(suggestion.id) }}
              className="font-display text-xl font-extrabold hover:text-primary"
            >
              {suggestion.name}
            </Link>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="size-3.5" /> من قائمة «ناوي أختمها»
            </p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
            أضف ألعابًا إلى «ناوي أختمها» ليقترح عليك.
          </div>
        )}
      </section>

      <Link
        to="/profile"
        className="flex items-center gap-3 rounded-3xl border border-border bg-card px-5 py-4 surface-hover"
      >
        <UserAvatar value={other.profile.avatar} size={40} framed={false} />
        <p className="flex-1 text-sm text-muted-foreground">
          شاهد إحصائياتك وقارن نفسك مع {other.profile.name}
        </p>
      </Link>
    </div>
  );
}
