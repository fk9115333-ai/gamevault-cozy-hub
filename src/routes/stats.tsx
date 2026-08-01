import { createFileRoute } from "@tanstack/react-router";
import { useCurrentData } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { SectionTitle, StatCard } from "@/components/ui-bits";
import { num } from "@/lib/dates";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Gamepad2, CheckCircle2, Timer, Star, Percent, Clock3 } from "lucide-react";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "الإحصائيات — GameHub" },
      { name: "description", content: "رسوم بيانية احترافية لساعات اللعب والإنجاز والتصنيفات." },
      { property: "og:title", content: "الإحصائيات — GameHub" },
      { property: "og:description", content: "تحليلات كاملة لحياتك في الألعاب." },
    ],
  }),
  component: StatsPage,
});

const COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
];

function StatsPage() {
  const data = useCurrentData();
  const s = computeStats(data.entries);
  const genreData = s.genres.slice(0, 5).map(([name, value]) => ({ name, value }));
  const platformData = s.platforms.slice(0, 6).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-8">
      <SectionTitle title="الإحصائيات" subtitle="تحليل شامل لمكتبتك" />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="كل الألعاب" value={s.total} icon={Gamepad2} />
        <StatCard label="مكتملة" value={s.completed} icon={CheckCircle2} index={1} />
        <StatCard label="ساعات" value={s.hours} icon={Timer} index={2} />
        <StatCard label="متوسط التقييم" value={s.avgRating} icon={Star} index={3} />
        <StatCard
          label="نسبة الإكمال"
          value={`${num(s.completionRate)}%`}
          icon={Percent}
          index={4}
        />
        <StatCard label="ساعات الانتظار" value={s.backlogHours} icon={Clock3} index={5} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="الألعاب المكتملة شهريًا">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={s.monthly}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.7} />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="games"
                stroke="var(--color-chart-1)"
                fill="url(#g1)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="الساعات شهريًا">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={s.monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="hours" fill="var(--color-chart-2)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="التصنيفات المفضلة">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={genreData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={95}
                paddingAngle={4}
              >
                {genreData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="المنصات">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={platformData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" stroke="var(--color-muted-foreground)" fontSize={11} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                stroke="var(--color-muted-foreground)"
                fontSize={11}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                }}
              />
              <Bar dataKey="value" fill="var(--color-chart-3)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoTile label="التصنيف المفضل" value={s.topGenre} />
        <InfoTile label="المنصة المفضلة" value={s.topPlatform} />
        <InfoTile label="المطوّر المفضل" value={s.topDeveloper} />
        <InfoTile label="الناشر المفضل" value={s.topPublisher} />
        <InfoTile label="أطول لعبة" value={s.longest ? `${s.longest.name}` : "—"} />
        <InfoTile label="أقصر لعبة" value={s.shortest ? `${s.shortest.name}` : "—"} />
        <InfoTile label="أنشط شهر" value={s.mostActiveMonth} />
        <InfoTile
          label="متوسط الألعاب شهريًا"
          value={num(s.monthly.length ? s.completed / s.monthly.length : 0, 1)}
        />
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-4">
      <h3 className="mb-3 font-display text-sm font-bold">{title}</h3>
      {children}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate font-display font-bold">{value}</p>
    </div>
  );
}
