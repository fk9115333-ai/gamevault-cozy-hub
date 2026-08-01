import { createFileRoute } from "@tanstack/react-router";
import { useCurrentData, useStore } from "@/lib/store";
import { computeStats, computeAchievements, activityIcon } from "@/lib/stats";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { gregorian, hijri, num } from "@/lib/dates";
import { UserSwitcher } from "@/components/UserSwitcher";
import { motion } from "motion/react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "الملف الشخصي — GameHub" },
      { name: "description", content: "ملفك الشخصي: الإحصائيات، الإنجازات، الخط الزمني وقاعة المشاهير." },
      { property: "og:title", content: "الملف الشخصي — GameHub" },
      { property: "og:description", content: "كل ما يخصك في مكان واحد." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const data = useCurrentData();
  const updateProfile = useStore((s) => s.updateProfile);
  const s = computeStats(data.entries);
  const unlocked = computeAchievements(data.entries).filter((a) => a.unlocked);

  const hallOfFame = [...data.entries]
    .filter((e) => e.personalRating > 0)
    .sort((a, b) => b.personalRating - a.personalRating)
    .slice(0, 10);

  const now = new Date();
  const memories = data.entries.filter((e) => {
    if (!e.completedAt) return false;
    const d = new Date(e.completedAt);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() < now.getFullYear();
  });

  const sessionHours = (days: number) =>
    data.entries
      .filter((e) => new Date(e.addedAt).getTime() > Date.now() - days * 86400000)
      .reduce((sum, e) => sum + e.hours, 0);

  return (
    <div className="space-y-8">
      <div className="lg:hidden">
        <UserSwitcher />
      </div>

      <section className="rounded-[2rem] border border-border bg-card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-20 place-items-center rounded-3xl bg-[var(--gradient-primary)] text-4xl">
            {data.profile.avatar}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl font-black">{data.profile.name}</h1>
            <p className="text-sm text-muted-foreground">{data.profile.bio}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <div>
            <Label className="mb-1 block text-xs">النبذة</Label>
            <Textarea
              value={data.profile.bio}
              onChange={(e) => updateProfile({ bio: e.target.value })}
            />
          </div>
          <div className="grid gap-3">
            <div>
              <Label className="mb-1 block text-xs">اللعبة المفضلة</Label>
              <Input
                value={data.profile.favoriteGame}
                onChange={(e) => updateProfile({ favoriteGame: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="mb-1 block text-xs">المنصة المفضلة</Label>
                <Input
                  value={data.profile.favoritePlatform}
                  onChange={(e) => updateProfile({ favoritePlatform: e.target.value })}
                />
              </div>
              <div>
                <Label className="mb-1 block text-xs">التصنيف المفضل</Label>
                <Input
                  value={data.profile.favoriteGenre}
                  onChange={(e) => updateProfile({ favoriteGenre: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { l: "ألعاب مكتملة", v: num(s.completed) },
          { l: "ساعات اللعب", v: num(s.hours) },
          { l: "إنجازات", v: num(unlocked.length) },
          { l: "نسبة الإكمال", v: `${num(s.completionRate)}%` },
        ].map((x) => (
          <div key={x.l} className="rounded-3xl border border-border bg-card p-4 text-center">
            <p className="font-display text-2xl font-extrabold gradient-text">{x.v}</p>
            <p className="text-[11px] text-muted-foreground">{x.l}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-3 sm:grid-cols-4">
        {[
          { l: "هذا الأسبوع", v: sessionHours(7) },
          { l: "هذا الشهر", v: sessionHours(30) },
          { l: "هذا العام", v: sessionHours(365) },
          { l: "الإجمالي", v: s.hours },
        ].map((x) => (
          <div key={x.l} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] text-muted-foreground">{x.l}</p>
            <p className="font-display text-xl font-bold">{num(x.v)} ساعة</p>
          </div>
        ))}
      </section>

      {memories.length > 0 && (
        <section>
          <SectionTitle title="ذكريات اليوم" />
          <div className="space-y-2">
            {memories.map((m) => (
              <div key={m.id} className="rounded-2xl glass p-4 text-sm">
                في مثل هذا اليوم أنهيت «{m.name}» — {gregorian(m.completedAt)} · {hijri(m.completedAt)}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="قاعة المشاهير" subtitle="أفضل 10 ألعاب حسب تقييمك" />
        {hallOfFame.length ? (
          <div className="space-y-2">
            {hallOfFame.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3"
              >
                <span className="font-display text-xl font-black text-accent">#{i + 1}</span>
                {g.image && (
                  <img src={g.image} alt={g.name} loading="lazy" className="size-14 rounded-xl object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold">{g.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {g.review || "بدون مراجعة"} · {num(g.hours)} ساعة
                  </p>
                </div>
                <span className="font-display font-bold text-primary">{g.personalRating}/10</span>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState text="قيّم ألعابك لتظهر هنا." />
        )}
      </section>

      <section>
        <SectionTitle title="الخط الزمني" />
        <div className="space-y-2 rounded-3xl border border-border bg-card p-4">
          {data.activities.length ? (
            data.activities.map((a) => (
              <div key={a.id} className="flex gap-3 border-r-2 border-primary/40 pr-3 text-sm">
                <span>{activityIcon(a.type)}</span>
                <div>
                  <p>{a.text}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {gregorian(a.at)} · {hijri(a.at)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-xs text-muted-foreground">لا نشاط بعد</p>
          )}
        </div>
      </section>
    </div>
  );
}
