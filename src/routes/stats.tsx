import { createFileRoute } from "@tanstack/react-router";
import { useCurrentData } from "@/lib/store";
import { computeStats } from "@/lib/stats";
import { SectionTitle, StatCard } from "@/components/ui-bits";
import { num } from "@/lib/dates";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CheckCircle2, Timer, CalendarDays, Sun } from "lucide-react";

export const Route = createFileRoute("/stats")({
  head: () => ({
    meta: [
      { title: "الإحصائيات — GameHub" },
      { name: "description", content: "أرقام نظيفة: متوسط اللعب اليومي ومعدل التختيم الشهري." },
      { property: "og:title", content: "الإحصائيات — GameHub" },
      { property: "og:description", content: "تحليلات مبسّطة لحياتك في الألعاب." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const data = useCurrentData();
  const s = computeStats(data.entries);

  return (
    <div className="space-y-8">
      <SectionTitle title="الإحصائيات" subtitle="أهم الأرقام فقط" />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="مكتملة" value={s.completed} icon={CheckCircle2} />
        <StatCard label="ساعات اللعب" value={s.hours} icon={Timer} index={1} />
        <StatCard
          label="متوسط اللعب اليومي"
          value={`${num(s.avgDailyHours, 1)} ساعة`}
          icon={Sun}
          index={2}
        />
        <StatCard
          label="متوسط التختيم شهريًا"
          value={`${num(s.avgMonthlyCompleted, 1)} لعبة`}
          icon={CalendarDays}
          index={3}
        />
      </div>

      <div className="rounded-3xl border border-border bg-card p-4">
        <h3 className="mb-3 font-display text-sm font-bold">الألعاب المكتملة شهريًا</h3>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={s.monthly}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.7} />
                <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
            <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={11} />
            <YAxis stroke="var(--color-muted-foreground)" fontSize={11} allowDecimals={false} />
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
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <InfoTile
          label="أطول لعبة"
          value={s.longest ? `${s.longest.name} · ${num(s.longest.hours)} ساعة` : "—"}
        />
        <InfoTile label="أنشط شهر" value={s.mostActiveMonth} />
      </div>
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
