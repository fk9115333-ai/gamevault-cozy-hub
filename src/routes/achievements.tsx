import { createFileRoute } from "@tanstack/react-router";
import { useCurrentData } from "@/lib/store";
import { computeAchievements } from "@/lib/stats";
import { SectionTitle } from "@/components/ui-bits";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { num } from "@/lib/dates";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "الإنجازات — GameHub" },
      { name: "description", content: "نظام إنجازات مخصص يتتبع كل ما تحققه في عالم الألعاب." },
      { property: "og:title", content: "الإنجازات — GameHub" },
      { property: "og:description", content: "افتح إنجازاتك الخاصة كلما تقدمت." },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const data = useCurrentData();
  const list = computeAchievements(data.entries);
  const unlocked = list.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <SectionTitle
        title="الإنجازات"
        subtitle={`${num(unlocked)} من ${num(list.length)} إنجاز مفتوح`}
      />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        {list.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.03 }}
            className={cn(
              "rounded-3xl border p-4 transition-colors",
              a.unlocked
                ? "border-accent/40 bg-card shadow-[var(--shadow-glow)]"
                : "border-border bg-card/60 opacity-70",
            )}
          >
            <p className={cn("text-3xl", !a.unlocked && "grayscale")}>{a.icon}</p>
            <h3 className="mt-2 font-display text-sm font-bold">{a.title}</h3>
            <p className="text-[11px] text-muted-foreground">{a.desc}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-secondary">
              <div
                className={cn(
                  "h-full rounded-full",
                  a.unlocked ? "bg-[var(--gradient-accent)]" : "bg-primary/60",
                )}
                style={{ width: `${a.progress}%` }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
