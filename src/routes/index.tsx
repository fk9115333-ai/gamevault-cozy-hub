import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useStore, type UserId } from "@/lib/store";
import { computeLevel } from "@/lib/stats";
import { buzz } from "@/lib/haptics";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "من يلعب الآن؟ — GameHub" },
      {
        name: "description",
        content: "اختر ملفك الشخصي — فيصل أو مشعل — وادخل لوحة ألعابك الخاصة.",
      },
      { property: "og:title", content: "من يلعب الآن؟ — GameHub" },
      { property: "og:description", content: "لوحة ألعاب شخصية لفيصل ومشعل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfileSelect,
});

function ProfileSelect() {
  const navigate = useNavigate();
  const users = useStore((s) => s.users);
  const chooseProfile = useStore((s) => s.chooseProfile);

  const pick = (u: UserId) => {
    buzz(30);
    chooseProfile(u);
    void navigate({ to: "/home" });
  };

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <div className="w-full max-w-3xl space-y-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-black md:text-5xl"
        >
          من يلعب الآن؟
        </motion.h1>

        <div className="grid grid-cols-2 gap-6 md:gap-12">
          {(["faisal", "mishal"] as UserId[]).map((u, i) => {
            const p = users[u].profile;
            const { level } = computeLevel(users[u].entries);
            return (
              <motion.button
                key={u}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => pick(u)}
                className="group flex flex-col items-center gap-4"
              >
                <span className="grid aspect-square w-full place-items-center rounded-[2rem] border border-border bg-card text-6xl transition-all group-hover:border-primary group-hover:shadow-[0_0_60px_-15px_hsl(var(--primary))] md:text-8xl">
                  {p.avatar}
                </span>
                <span className="font-display text-xl font-extrabold md:text-2xl">{p.name}</span>
                <span className="text-xs text-muted-foreground">المستوى {level}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </main>
  );
}
