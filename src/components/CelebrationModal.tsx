import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Confetti } from "./Confetti";
import { dayMonth, num } from "@/lib/dates";
import { completionSummary } from "@/lib/completion";
import { findFranchise, franchiseTimeline } from "@/lib/stats";
import type { GameEntry } from "@/lib/store";
import { useCurrentData } from "@/lib/store";
import { Clock, CalendarRange, Gauge, Trophy } from "lucide-react";

/** بطاقة الختم التفصيلية — تُعرض داخل المودال وفي صفحة اللعبة */
export function CompletionCard({ game }: { game: GameEntry }) {
  const s = completionSummary(game);

  const cells = [
    { icon: Clock, label: "إجمالي اللعب", value: `${num(s.hours, 1)} ساعة` },
    { icon: CalendarRange, label: "المدة المستغرقة", value: s.days ? `${num(s.days)} يوم` : "—" },
    { icon: Gauge, label: "المعدل اليومي", value: s.dailyAvg ? `${num(s.dailyAvg, 1)} ساعة` : "—" },
    {
      icon: Trophy,
      label: "التقييم",
      value: game.personalRating ? `${num(game.personalRating, 1)}/10` : "بدون",
    },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-secondary/40 p-3 text-center">
            <c.icon className="mx-auto size-4 text-primary" />
            <p className="mt-1 font-display text-lg font-black gradient-text">{c.value}</p>
            <p className="text-[10px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-secondary/40 px-4 py-3 text-center text-xs text-muted-foreground">
        من {dayMonth(s.startedAt)} إلى {dayMonth(s.completedAt)}
        {s.sessions > 0 ? ` · ${num(s.sessions)} جلسة` : ""}
      </div>

      <div className="rounded-2xl border-2 border-yellow-500/50 bg-secondary/30 px-4 py-3 text-center shadow-[0_0_20px_-8px_rgba(234,179,8,0.6)]">
        <p className="font-display text-base font-black gold-glow">
          {s.badge.emoji} {s.badge.label}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{s.badge.hint}</p>
      </div>
    </div>
  );
}

export function CelebrationModal({
  game,
  onClose,
}: {
  game: GameEntry | null;
  onClose: () => void;
}) {
  const data = useCurrentData();
  if (!game) return null;

  const order = data.entries.filter((e) => e.status === "completed").length;
  const f = findFranchise(game.name);
  const timeline = f ? franchiseTimeline(f.name, data.entries) : null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="overflow-hidden sm:max-w-md">
        <Confetti run />
        <div className="space-y-4 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="font-display text-2xl font-black">مبروك! ختمت «{game.name}»</h2>

          <CompletionCard game={game} />

          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="rounded-2xl bg-secondary/50 px-4 py-2.5">
              أصبحت اللعبة رقم {num(order)} في مكتبتك
            </li>
            {timeline && (
              <li className="rounded-2xl bg-secondary/50 px-4 py-2.5">
                أكملت {num(timeline.pct)}% من سلسلة {timeline.name}
              </li>
            )}
            {game.fullCompletion && (
              <li className="rounded-2xl bg-secondary/50 px-4 py-2.5">وحصلت على البلاتينيوم 🏆</li>
            )}
          </ul>

          <Button className="w-full" onClick={onClose}>
            تمام 🔥
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
