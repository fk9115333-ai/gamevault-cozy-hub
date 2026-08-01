import { useEffect, useState } from "react";
import { countdown, num } from "@/lib/dates";

export function Countdown({ target, compact }: { target: string | null; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const c = countdown(target, now);
  if (!c) return <span className="text-xs text-muted-foreground">صدرت بالفعل</span>;

  const parts = [
    { v: c.days, l: "يوم" },
    { v: c.hours, l: "ساعة" },
    { v: c.minutes, l: "دقيقة" },
    { v: c.seconds, l: "ثانية" },
  ];

  if (compact)
    return (
      <span className="font-display text-sm font-bold text-accent tabular-nums">
        {num(c.days)} يوم · {String(c.hours).padStart(2, "0")}:
        {String(c.minutes).padStart(2, "0")}:{String(c.seconds).padStart(2, "0")}
      </span>
    );

  return (
    <div className="flex gap-2">
      {parts.map((p) => (
        <div
          key={p.l}
          className="min-w-[62px] rounded-2xl bg-secondary/70 px-2 py-2 text-center ring-1 ring-border"
        >
          <p className="font-display text-lg font-extrabold tabular-nums text-accent">
            {String(p.v).padStart(2, "0")}
          </p>
          <p className="text-[10px] text-muted-foreground">{p.l}</p>
        </div>
      ))}
    </div>
  );
}
