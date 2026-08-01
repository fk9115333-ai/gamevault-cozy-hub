import { useEffect, useState } from "react";
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
import { useStore, type GameEntry, type Status } from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import type { ReactNode } from "react";

const statuses: { v: Status; l: string }[] = [
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "مكتملة" },
  { v: "backlog", l: "الانتظار" },
  { v: "wishlist", l: "الرغبات" },
];

export function GameEditDialog({
  entry,
  trigger,
  onCompleted,
  open: openProp,
  onOpenChange,
}: {
  entry: GameEntry;
  trigger?: ReactNode;
  onCompleted?: () => void;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
}) {
  const [openState, setOpenState] = useState(false);
  const controlled = openProp !== undefined;
  const open = controlled ? openProp : openState;
  const setOpen = (o: boolean) => {
    if (!controlled) setOpenState(o);
    onOpenChange?.(o);
  };

  const [draft, setDraft] = useState(entry);
  const updateGame = useStore((s) => s.updateGame);
  const completeGame = useStore((s) => s.completeGame);
  const removeGame = useStore((s) => s.removeGame);

  useEffect(() => {
    if (open) setDraft(entry);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, entry.id]);

  const set = <K extends keyof GameEntry>(k: K, v: GameEntry[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const save = () => {
    buzz(30);
    updateGame(entry.id, draft);
    toast.success("تم الحفظ");
    setOpen(false);
  };

  const finish = () => {
    buzz([40, 60, 40]);
    completeGame(entry.id, draft);
    setOpen(false);
    onCompleted?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent dir="rtl" className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right font-display">{entry.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-2">
            {statuses.map((s) => (
              <Button
                key={s.v}
                variant={draft.status === s.v ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  buzz(20);
                  set("status", s.v);
                }}
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
              onValueChange={([v]) => {
                if (v && v % 5 === 0) buzz(50);
                set("personalRating", v ?? 0);
              }}
            />
          </div>

          <div>
            <Label className="mb-1 block text-xs">ساعات اللعب</Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={() => set("hours", Math.max(0, draft.hours - 1))}
              >
                −
              </Button>
              <Input
                type="number"
                className="text-center"
                value={draft.hours}
                onChange={(e) => set("hours", Number(e.target.value))}
              />
              <Button
                size="icon"
                variant="secondary"
                onClick={() => {
                  buzz(20);
                  set("hours", draft.hours + 1);
                }}
              >
                +
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
            <Label className="text-xs">إكمال 100%</Label>
            <Switch
              checked={draft.fullCompletion}
              onCheckedChange={(v) => {
                buzz(30);
                set("fullCompletion", v);
              }}
            />
          </div>

          <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
            <div>
              <Label className="text-xs">🎮🎮 لعبناها سوا</Label>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                تُضاف اللعبة والساعات تلقائيًا لملف أخوك
              </p>
            </div>
            <Switch
              checked={draft.coop}
              onCheckedChange={(v) => {
                buzz(30);
                set("coop", v);
              }}
            />
          </div>

          <div className="space-y-2">
            <Textarea
              placeholder="مراجعتك عن اللعبة"
              value={draft.review}
              onChange={(e) => set("review", e.target.value)}
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
