import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { buzz } from "@/lib/haptics";

const months = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** نافذة ترحيب تُعرض مرة واحدة لتحديد بداية رحلة التختيم */
export function WelcomeDialog() {
  const hydrated = useStore((s) => s.hydrated);
  const startDate = useStore((s) => s.users[s.currentUser].profile.gamingStartDate);
  const name = useStore((s) => s.users[s.currentUser].profile.name);
  const setGamingStartDate = useStore((s) => s.setGamingStartDate);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (hydrated && !startDate) setOpen(true);
  }, [hydrated, startDate]);

  const years = Array.from({ length: 30 }, (_, i) => now.getFullYear() - i);

  const save = () => {
    buzz(30);
    setGamingStartDate(`${year}-${String(month).padStart(2, "0")}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl" className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-right font-display text-xl">
            أهلاً {name} 👋
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          متى بدأت رحلتك الفعلية في عالم التختيم؟ نستخدم هذا التاريخ لحساب متوسطاتك بدقّة.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="mb-1 block text-xs">الشهر</Label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none"
            >
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="mb-1 block text-xs">السنة</Label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm outline-none"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button onClick={save} className="w-full">
          ابدأ الرحلة
        </Button>
      </DialogContent>
    </Dialog>
  );
}
