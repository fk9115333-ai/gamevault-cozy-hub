import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Confetti } from "./Confetti";
import { daysBetween, num } from "@/lib/dates";
import { findFranchise, franchiseTimeline } from "@/lib/stats";
import type { GameEntry } from "@/lib/store";
import { useCurrentData } from "@/lib/store";

export function CelebrationModal({
  game,
  onClose,
}: {
  game: GameEntry | null;
  onClose: () => void;
}) {
  const data = useCurrentData();
  if (!game) return null;

  const days = daysBetween(game.startedAt, game.completedAt);
  const order = data.entries.filter((e) => e.status === "completed").length;
  const f = findFranchise(game.name);
  const timeline = f ? franchiseTimeline(f.name, data.entries) : null;

  const lines = [
    game.hours > 0 ? `استغرقت ${num(game.hours, 1)} ساعة لإنهاء اللعبة` : null,
    days !== null ? `أنهيتها خلال ${num(days)} يوم` : null,
    `أصبحت اللعبة رقم ${num(order)} في مكتبتك`,
    timeline ? `أكملت ${num(timeline.pct)}% من سلسلة ${timeline.name}` : null,
    game.fullCompletion ? "وحصلت على البلاتينيوم 🏆" : null,
  ].filter(Boolean) as string[];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="overflow-hidden sm:max-w-md">
        <Confetti run />
        <div className="space-y-4 text-center">
          <div className="text-5xl">🎉</div>
          <h2 className="font-display text-2xl font-black">مبروك! ختمت «{game.name}»</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {lines.map((l) => (
              <li key={l} className="rounded-2xl bg-secondary/50 px-4 py-2.5">
                {l}
              </li>
            ))}
          </ul>
          <Button className="w-full" onClick={onClose}>
            تمام 🔥
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
