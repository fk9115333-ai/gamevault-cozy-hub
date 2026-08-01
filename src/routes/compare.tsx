import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { SectionTitle } from "@/components/ui-bits";
import { num } from "@/lib/dates";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "المقارنة — GameHub" },
      { name: "description", content: "قارن بين فيصل ومشعل في الساعات والإنجاز والتقييمات." },
      { property: "og:title", content: "المقارنة — GameHub" },
      { property: "og:description", content: "من الأفضل هذا العام؟ قارن الأرقام." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const users = useStore((s) => s.users);
  const a = computeStats(users.faisal.entries);
  const b = computeStats(users.mishal.entries);

  const rows = [
    { k: "الألعاب المكتملة", a: a.completed, b: b.completed },
    { k: "ساعات اللعب", a: a.hours, b: b.hours },
    { k: "متوسط التقييم", a: a.avgRating, b: b.avgRating },
    { k: "نسبة الإكمال", a: a.completionRate, b: b.completionRate },
    { k: "حجم المكتبة", a: a.total, b: b.total },
  ];

  const chart = rows.map((r) => ({ name: r.k, فيصل: Number(r.a.toFixed(1)), مشعل: Number(r.b.toFixed(1)) }));

  return (
    <div className="space-y-6">
      <SectionTitle title="فيصل ضد مشعل" subtitle="مقارنة مباشرة بين الحسابين" />

      <div className="grid gap-3 md:grid-cols-2">
        {[
          { p: users.faisal.profile, s: a },
          { p: users.mishal.profile, s: b },
        ].map((u) => (
          <div key={u.p.name} className="rounded-3xl border border-border bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-2xl bg-secondary text-2xl">
                {u.p.avatar}
              </span>
              <div>
                <h3 className="font-display text-lg font-extrabold">{u.p.name}</h3>
                <p className="text-xs text-muted-foreground">{u.p.bio}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Cell label="مكتملة" value={num(u.s.completed)} />
              <Cell label="ساعات" value={num(u.s.hours)} />
              <Cell label="التصنيف المفضل" value={u.s.topGenre} />
              <Cell label="المنصة المفضلة" value={u.s.topPlatform} />
              <Cell label="نسبة الإكمال" value={`${num(u.s.completionRate)}%`} />
              <Cell label="أنشط شهر" value={u.s.mostActiveMonth} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-bold">مقارنة الأرقام</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={10} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Legend />
              <Bar dataKey="فيصل" fill="var(--color-chart-1)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="مشعل" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4">
          <h3 className="mb-3 font-display text-sm font-bold">نظرة رادارية</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={chart}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="name" fontSize={10} stroke="var(--color-muted-foreground)" />
              <Radar dataKey="فيصل" stroke="var(--color-chart-1)" fill="var(--color-chart-1)" fillOpacity={0.35} />
              <Radar dataKey="مشعل" stroke="var(--color-chart-2)" fill="var(--color-chart-2)" fillOpacity={0.35} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-secondary/50 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="truncate font-bold">{value}</p>
    </div>
  );
}
