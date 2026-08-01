import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Crown, Sparkles, Timer, PlayCircle, Activity as ActivityIcon } from "lucide-react";
import { useCurrentData, useOtherData, useStore } from "@/lib/store";
import { activityIcon, gameOfMonth, memoryBox } from "@/lib/stats";
import { hijri, num } from "@/lib/dates";
import { SectionTitle } from "@/components/ui-bits";
import { LogSessionSheet } from "@/components/GameEditDialog";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "الرئيسية — GameHub" },
      {
        name: "description",
        content: "مواصلة اللعب، نبض الألعاب، لعبة الشهر، صندوق الذكريات واقتراح اليوم.",
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

  /** نبض الألعاب: نشاطات الأخوين مدمجة */
  const pulse = useMemo(() => {
    const tag = (uid: "faisal" | "mishal") =>
      users[uid].activities.map((a) => ({ ...a, who: users[uid].profile.name, avatar: users[uid].profile.avatar }));
    return [...tag("faisal"), ...tag("mishal")].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
  }, [users]);

  /** اقتراح اليوم: لعبة عشوائية من «ناوي أختمها» */
  const suggestion = useMemo(() => {
    const pool = data.entries.filter((e) => e.status === "backlog");
    if (!pool.length) return null;
    const seed = new Date().getDate() + currentUser.length;
    return pool[seed % pool.length]!;
  }, [data.entries, currentUser]);

  return (
    <div className="space-y-8">
      {/* A — مواصلة اللعب */}
      <motion.section
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2rem] border border-border"
      >
        {hero?.image && (
          <img src={hero.image} alt={hero.name} className="absolute inset-0 size-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="relative flex flex-col gap-5 p-6 md:p-8">
          <p className="text-xs text-muted-foreground">مواصلة اللعب</p>
          {hero ? (
            <>
              <Link to="/game/$id" params={{ id: String(hero.id) }}>
                <h1 className="font-display text-3xl font-black md:text-5xl">{hero.name}</h1>
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
            <p className="text-sm text-muted-foreground">لا توجد ألعاب قيد اللعب حالياً</p>
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
        <div className="max-h-80 space-y-2 overflow-y-auto rounded-3xl border border-border bg-card p-3">
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
            <p className="flex items-center justify-center gap-2 p-6 text-center text-xs text-muted-foreground">
              <ActivityIcon className="size-4" /> لا نشاط بعد
            </p>
          )}
        </div>
      </section>

      {/* C — لعبة الشهر */}
      <section>
        <SectionTitle title="لعبة الشهر" />
        {gotm ? (
          <Link
            to="/game/$id"
            params={{ id: String(gotm.game.id) }}
            className="relative block overflow-hidden rounded-[2rem] border-2 border-yellow-500/60 p-6 shadow-[0_0_25px_-8px_rgba(234,179,8,0.5)]"
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
              <div>
                <h3 className="font-display text-2xl font-extrabold">{gotm.game.name}</h3>
                <p className="text-xs text-primary">{num(gotm.hours, 1)} ساعة هذا الشهر</p>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            سجّل جلسات هذا الشهر لتظهر لعبة الشهر.
          </div>
        )}
      </section>

      {/* D — صندوق الذكريات */}
      <section>
        <SectionTitle title="صندوق الذكريات" />
        <div className="space-y-2 rounded-[2rem] border border-border bg-card p-4">
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
            <p className="p-4 text-center text-sm text-muted-foreground">ذكرياتك تُبنى الآن...</p>
          )}
        </div>
      </section>

      {/* E — اقتراح اليوم */}
      <section>
        <SectionTitle title="اقتراح اليوم" />
        {suggestion ? (
          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card p-6">
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 gold-glow" /> ليش ما تلعب هذي اليوم؟
            </p>
            <Link
              to="/game/$id"
              params={{ id: String(suggestion.id) }}
              className="font-display text-2xl font-extrabold hover:text-primary"
            >
              {suggestion.name}
            </Link>
            <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <Timer className="size-3.5" /> من قائمة «ناوي أختمها»
            </p>
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
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
