import { createFileRoute, Link } from "@tanstack/react-router";
import { useCurrentData, useStore } from "@/lib/store";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { Countdown } from "@/components/Countdown";
import { gregorian, hijri } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { buzz } from "@/lib/haptics";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/upcoming")({
  head: () => ({
    meta: [
      { title: "المرتقبة — GameHub" },
      { name: "description", content: "قائمة الحماس: الألعاب التي تنتظرها أنت، بعدّاد تنازلي حيّ." },
      { property: "og:title", content: "المرتقبة — GameHub" },
      { property: "og:description", content: "عدّاد تنازلي ضخم لكل لعبة تنتظرها." },
    ],
  }),
  component: UpcomingPage,
});

function UpcomingPage() {
  const data = useCurrentData();
  const removeGame = useStore((s) => s.removeGame);

  const list = [...data.entries]
    .filter((e) => e.status === "hype")
    .sort((a, b) => (a.released ?? "9999").localeCompare(b.released ?? "9999"));

  return (
    <div className="space-y-6">
      <SectionTitle
        title="المرتقبة"
        subtitle="قائمة الحماس — أضف أي لعبة من البحث أو صفحة اللعبة"
      />

      {list.length ? (
        <div className="space-y-6">
          {list.map((g, i) => (
            <motion.article
              key={g.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.06, 0.4) }}
              className="relative overflow-hidden rounded-[2rem] border border-border"
            >
              {g.image && (
                <img
                  src={g.image}
                  alt={g.name}
                  loading="lazy"
                  className="absolute inset-0 size-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-background/40" />
              <div className="relative flex flex-col gap-5 p-6 pt-40 md:p-10 md:pt-56">
                <div>
                  <Link to="/game/$id" params={{ id: String(g.id) }}>
                    <h3 className="font-display text-3xl font-black md:text-4xl">{g.name}</h3>
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {gregorian(g.released)} · {hijri(g.released)}
                  </p>
                </div>
                <Countdown target={g.released} size="lg" />
                <div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="rounded-xl"
                    onClick={() => {
                      buzz(30);
                      removeGame(g.id);
                      toast("أُزيلت من المرتقبة");
                    }}
                  >
                    <Trash2 className="size-3.5" /> إزالة
                  </Button>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <EmptyState text="قائمة الحماس فارغة — ابحث عن لعبة وأضفها إلى «المرتقبة»." />
      )}
    </div>
  );
}
