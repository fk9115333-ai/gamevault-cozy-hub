import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Star } from "lucide-react";
import {
  isFutureRelease,
  useStore,
  type GameEntry,
  type Status,
} from "@/lib/store";
import { buzz } from "@/lib/haptics";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { ReactNode } from "react";

const allStatuses: { v: Status; l: string }[] = [
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "مكتملة" },
  { v: "next", l: "التالي" },
  { v: "backlog", l: "الانتظار" },
];

const toDateInput = (iso: string | null) => (iso ? iso.slice(0, 10) : "");

/** تقييم مرئي من 10 نجوم */
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-row-reverse justify-end gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} من 10`}
          onClick={() => {
            buzz(20);
            onChange(n === value ? 0 : n);
          }}
        >
          <Star
            className={cn(
              "size-5 transition-colors",
              n <= value ? "fill-accent text-accent" : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </div>
  );
}

/** إدخال جلسة لعب: من - إلى مع حساب المدة تلقائيًا */
function SessionBox({ entryId }: { entryId: number }) {
  const addSession = useStore((s) => s.addSession);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [start, setStart] = useState("20:30");
  const [end, setEnd] = useState("23:10");
  const [manual, setManual] = useState("");

  const minutes = useMemo(() => {
    if (manual) return Math.max(0, Math.round(Number(manual) * 60));
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return 0;
    let d = (eh! * 60 + em!) - (sh! * 60 + sm!);
    if (d < 0) d += 24 * 60; // امتدت الجلسة بعد منتصف الليل
    return d;
  }, [start, end, manual]);

  return (
    <div className="space-y-3 rounded-2xl bg-secondary/50 p-4">
      <Label className="text-xs font-bold">⏱️ جلسة لعب</Label>
      <div className="grid grid-cols-3 gap-2">
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
      </div>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          step="0.25"
          placeholder="أو أدخل المدة يدويًا (ساعات)"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <span className="whitespace-nowrap text-xs text-muted-foreground">
          {Math.floor(minutes / 60)} س {minutes % 60} د
        </span>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="w-full"
        disabled={minutes <= 0}
        onClick={() => {
          buzz(30);
          addSession(entryId, { date, start, end, minutes });
          setManual("");
          toast.success("أُضيفت الجلسة إلى ساعاتك");
        }}
      >
        إضافة الجلسة
      </Button>
    </div>
  );
}

export function GameEditDialog({
  entry,
  trigger,
  onCompleted,
  open: openProp,
  onOpenChange,
}: {
  entry: GameEntry;
  trigger?: ReactNode;
  onCompleted?: (e: GameEntry) => void;
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

  const unreleased = isFutureRelease(entry.released);
  const statuses = unreleased ? [{ v: "hype" as Status, l: "المرتقبة" }] : allStatuses;
  const isCompleted = draft.status === "completed";

  const normalized = (): GameEntry => ({
    ...draft,
    status: unreleased ? "hype" : draft.status,
    fullCompletion: isCompleted ? draft.fullCompletion : false,
    progress: isCompleted ? 100 : draft.progress,
    completedAt: isCompleted ? (draft.completedAt ?? new Date().toISOString()) : null,
  });

  const save = () => {
    buzz(30);
    updateGame(entry.id, normalized());
    toast.success("تم الحفظ");
    setOpen(false);
  };

  const finish = () => {
    buzz([40, 60, 40]);
    const payload = { ...normalized(), status: "completed" as Status };
    completeGame(entry.id, payload);
    setOpen(false);
    onCompleted?.({ ...entry, ...payload, completedAt: payload.completedAt ?? new Date().toISOString() });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent dir="rtl" className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-right font-display">{entry.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {unreleased && (
            <p className="rounded-2xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground">
              لم تصدر بعد — يمكن إضافتها إلى «المرتقبة» فقط.
            </p>
          )}
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

          <div className="space-y-2">
            <Label className="block text-xs">تقييمك: {draft.personalRating}/10</Label>
            <StarRating value={draft.personalRating} onChange={(v) => set("personalRating", v)} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
              <Label className="text-xs">تنصح بها؟</Label>
              <Switch
                checked={draft.recommend}
                onCheckedChange={(v) => {
                  buzz(20);
                  set("recommend", v);
                }}
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
              <Label className="text-xs">ستعيد لعبها؟</Label>
              <Switch
                checked={draft.replay}
                onCheckedChange={(v) => {
                  buzz(20);
                  set("replay", v);
                }}
              />
            </div>
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

          {draft.status === "current" && <SessionBox entryId={entry.id} />}

          {isCompleted && (
            <>
              <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                <Label className="text-xs">إكمال 100% 🏆</Label>
                <Switch
                  checked={draft.fullCompletion}
                  onCheckedChange={(v) => {
                    buzz(30);
                    set("fullCompletion", v);
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-secondary/50 px-4 py-3">
                <div>
                  <Label className="mb-1 block text-xs">تاريخ البدء</Label>
                  <Input
                    type="date"
                    value={toDateInput(draft.startedAt)}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      set("startedAt", e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                  />
                </div>
                <div>
                  <Label className="mb-1 block text-xs">تاريخ الختم</Label>
                  <Input
                    type="date"
                    value={toDateInput(draft.completedAt)}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={(e) =>
                      set("completedAt", e.target.value ? new Date(e.target.value).toISOString() : null)
                    }
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl bg-secondary/50 px-4 py-3">
                <Label className="text-xs">👑 قاعة المشاهير</Label>
                <Switch
                  checked={draft.hallOfFame}
                  onCheckedChange={(v) => {
                    buzz(30);
                    set("hallOfFame", v);
                  }}
                />
              </div>
            </>
          )}

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
            {entry.status !== "completed" && !unreleased && (
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
