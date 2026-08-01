import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";

const COLORS = ["#4cc9f0", "#f4a261", "#4ade80", "#f472b6", "#a78bfa"];

export function Confetti({ run }: { run: boolean }) {
  const [seed, setSeed] = useState(0);
  useEffect(() => {
    if (run) setSeed((s) => s + 1);
  }, [run]);

  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        id: `${seed}-${i}`,
        x: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2 + Math.random() * 1.8,
        rotate: Math.random() * 720 - 360,
        color: COLORS[i % COLORS.length],
        size: 6 + Math.random() * 8,
      })),
    [seed],
  );

  if (!run) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          initial={{ y: -40, opacity: 1, rotate: 0 }}
          animate={{ y: "110vh", opacity: 0, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.5,
            background: p.color,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}
