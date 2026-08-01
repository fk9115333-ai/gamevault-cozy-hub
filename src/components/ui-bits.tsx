import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { num } from "@/lib/dates";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  index = 0,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  hint?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="rounded-3xl border border-border bg-card p-4 surface-hover"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="grid size-9 place-items-center rounded-2xl bg-secondary/70 text-primary">
          <Icon className="size-4" />
        </span>
      </div>
      <p className="font-display text-2xl font-extrabold">
        {typeof value === "number" ? num(value, 1) : value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </motion.div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
