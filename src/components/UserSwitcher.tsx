import { useStore, type UserId } from "@/lib/store";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

const users: { id: UserId; label: string; emoji: string }[] = [
  { id: "faisal", label: "فيصل", emoji: "🎮" },
  { id: "mishal", label: "مشعل", emoji: "🕹️" },
];

export function UserSwitcher({ compact = false }: { compact?: boolean }) {
  const current = useStore((s) => s.currentUser);
  const setUser = useStore((s) => s.setUser);

  return (
    <div
      className={cn(
        "flex gap-1 rounded-2xl bg-secondary/60 p-1",
        compact ? "text-xs" : "w-full text-sm",
      )}
    >
      {users.map((u) => (
        <button
          key={u.id}
          onClick={() => setUser(u.id)}
          className={cn(
            "relative flex-1 rounded-xl px-3 py-2 font-semibold transition-colors",
            current === u.id ? "text-primary-foreground" : "text-muted-foreground",
          )}
        >
          {current === u.id && (
            <motion.span
              layoutId="user-pill"
              className="absolute inset-0 rounded-xl bg-[var(--gradient-primary)]"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
          )}
          <span className="relative">
            {u.emoji} {u.label}
          </span>
        </button>
      ))}
    </div>
  );
}
