import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useStore, type GameEntry, type Status, type Priority } from "@/lib/store";
import { toast } from "sonner";
import type { ReactNode } from "react";

const statuses: { v: Status; l: string }[] = [
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "مكتملة" },
  { v: "backlog", l: "الانتظار" },
  { v: "wishlist", l: "الرغبات" },
];

const priorities: { v: Priority; l: string }[] = [
  { v: "high", l: "🔥 عالية" },
  { v: "medium", l: "⭐ متوسطة" },
  { v: "low", l: "🕒 منخفضة" },
];

export function GameEditDialog({
  entry,
  trigger,
  onCompleted,
}: {
  entry: GameEntry;
  trigger: ReactNode;
  onCompleted?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(entry);
  const updateGame = useStore((s) => s.updateGame);
  const completeGame = useStore((s) => s.completeGame);
  const removeGame = useStore((s) => s.removeGame);

  const set = <K extends keyof GameEntry>(k: K, v: GameEntry[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    updateGame(entry.id, draft);
    toast.success("تم الحفظ");
    setOpen(false);
  };

  const finish = () => {
    completeGame(entry.id, draft);
    setOpen(false);
    onCompleted?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setDraft(entry);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right font-display">{entry.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((s) => (
              <Button
                key={s.v}
                variant={draft.status === s.v ? "default" : "secondary"}
                size="sm"
                onClick={() => set("status", s.v)}
              >
                {s.l}
              </Button>
            ))}
          </div>

          <div>
            <Label className="mb-2 block text-xs">نسبة التقدم: {draft.progress}%</Label>
            <Slider
              value={[draft.progress]}
              max={100}
              step={1}
              onValueChange={([v]) => set("progress", v ?? 0)}
            />
          </div>

          <div>
            <Label className="mb-2 block text-xs">تقييمك: {draft.personalRating}/10</Label>
            <Slider
              value={[draft.personalRating]}
              max={10}
              step={0.5}
              onValueChange={([v]) => set("personalRating", v ?? 0)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block text-xs">ساعات اللعب</Label>
              <Input
                type="number"
                value={draft.hours}
                onChange={(e) => set("hours", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">المنصة</Label>
              <Input value={draft.platform} onChange={(e) => set("platform", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">الصعوبة</Label>
              <Input value={draft.difficulty} onChange={(e) => set("difficulty", e.target.value)} />
            </div>
            <div>
              <Label className="mb-1 block text-xs">عدد الإنجازات</Label>
              <Input
                type="number"
                value={draft.achievements}
                onChange={(e) => set("achievements", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">مرات الإعادة</Label>
              <Input
                type="number"
                value={draft.replays}
                onChange={(e) => set("replays", Number(e.target.value))}
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs">السعر التقديري</Label>
              <Input
                type="number"
                value={draft.price}
                onChange={(e) => set("price", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="flex gap-2">
            {priorities.map((p) => (
              <Button
                key={p.v}
                size="sm"
                variant={draft.priority === p.v ? "default" : "secondary"}
                onClick={() => set("priority", p.v)}
              >
                {p.l}
              </Button>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
            <Label className="text-xs">إكمال 100%</Label>
            <Switch
              checked={draft.fullCompletion}
              onCheckedChange={(v) => set("fullCompletion", v)}
            />
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="مراجعتك عن اللعبة"
              value={draft.review}
              onChange={(e) => set("review", e.target.value)}
            />
            <Textarea
              placeholder="أفضل لحظة"
              value={draft.bestMoment}
              onChange={(e) => set("bestMoment", e.target.value)}
            />
            <Textarea
              placeholder="أسوأ لحظة"
              value={draft.worstMoment}
              onChange={(e) => set("worstMoment", e.target.value)}
            />
            <Textarea
              placeholder="ملاحظات خاصة"
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={save} className="flex-1">
              حفظ
            </Button>
            {entry.status !== "completed" && (
              <Button onClick={finish} variant="secondary" className="flex-1">
                🏁 إنهاء اللعبة
              </Button>
            )}
            <Button
              variant="destructive"
              onClick={() => {
                removeGame(entry.id);
                setOpen(false);
                toast("تم الحذف");
              }}
            >
              حذف
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
