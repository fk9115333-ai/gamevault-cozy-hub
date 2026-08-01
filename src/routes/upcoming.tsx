import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getUpcoming } from "@/lib/rawg";
import { Countdown } from "@/components/Countdown";
import { SectionTitle } from "@/components/ui-bits";
import { gregorian, hijri } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { motion } from "motion/react";
import { Bell, Heart } from "lucide-react";

export const Route = createFileRoute("/upcoming")({
  head: () => ({
    meta: [
      { title: "الإصدارات القادمة — GameHub" },
      { name: "description", content: "أقرب إصدارات الألعاب مع عدّاد تنازلي حيّ وتاريخ هجري." },
      { property: "og:title", content: "الإصدارات القادمة — GameHub" },
      { property: "og:description", content: "تابع كل إصدار قادم بالعد التنازلي." },
    ],
  }),
  component: UpcomingPage,
});

function UpcomingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["upcoming"],
    queryFn: getUpcoming,
    staleTime: 1000 * 60 * 60,
  });
  const addGame = useStore((s) => s.addGame);

  return (
    <div className="space-y-6">
      <SectionTitle title="الإصدارات القادمة" subtitle="مرتّبة حسب الأقرب صدورًا" />
      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-3xl bg-card/70" />
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {data?.map((g, i) => (
          <motion.article
            key={g.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            className="relative overflow-hidden rounded-3xl border border-border surface-hover"
          >
            {g.background_image && (
              <img
                src={g.background_image}
                alt={g.name}
                loading="lazy"
                className="absolute inset-0 size-full object-cover opacity-30"
              />
            )}
            <div className="relative space-y-3 bg-gradient-to-t from-card via-card/80 to-card/40 p-5">
              <Link to="/game/$id" params={{ id: String(g.id) }}>
                <h3 className="font-display text-lg font-extrabold">{g.name}</h3>
              </Link>
              <p className="text-xs text-muted-foreground">
                {gregorian(g.released)} · {hijri(g.released)}
              </p>
              <p className="text-xs text-muted-foreground">
                {(g.genres ?? []).map((x) => x.name).join("، ")}
                {g.platforms?.length
                  ? ` · ${g.platforms.slice(0, 3).map((p) => p.platform.name).join("، ")}`
                  : ""}
              </p>
              <Countdown target={g.released} />
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="rounded-xl"
                  onClick={() => {
                    addGame(g, "wishlist");
                    toast.success("أُضيفت لقائمة الرغبات");
                  }}
                >
                  <Heart className="size-3.5" /> رغبات
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => toast.success(`سنذكّرك قبل صدور ${g.name}`)}
                >
                  <Bell className="size-3.5" /> تذكير
                </Button>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  );
}
