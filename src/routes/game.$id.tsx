import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getGame, getScreenshots, getSimilar } from "@/lib/rawg";
import { gregorian, hijri, num } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { useStore, type Status } from "@/lib/store";
import { toast } from "sonner";
import { Countdown } from "@/components/Countdown";
import { motion } from "motion/react";
import { ExternalLink } from "lucide-react";

export const Route = createFileRoute("/game/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل اللعبة — GameHub" },
      { name: "description", content: "صفحة تفاصيل غنية: القصة، الصور، المنصات، التقييمات والتاريخ الهجري." },
      { property: "og:title", content: "تفاصيل اللعبة — GameHub" },
      { property: "og:description", content: "كل معلومات اللعبة في صفحة واحدة." },
    ],
  }),
  component: GamePage,
});

const addOptions: { v: Status; l: string }[] = [
  { v: "current", l: "قيد اللعب" },
  { v: "completed", l: "مكتملة" },
  { v: "backlog", l: "الانتظار" },
  { v: "wishlist", l: "الرغبات" },
];

function GamePage() {
  const { id } = Route.useParams();
  const addGame = useStore((s) => s.addGame);

  const { data: game, isLoading } = useQuery({
    queryKey: ["game", id],
    queryFn: () => getGame(id),
    staleTime: 1000 * 60 * 60,
  });
  const { data: shots } = useQuery({
    queryKey: ["shots", id],
    queryFn: () => getScreenshots(id),
    staleTime: 1000 * 60 * 60,
  });
  const { data: similar } = useQuery({
    queryKey: ["similar", id],
    queryFn: () => getSimilar(id),
    staleTime: 1000 * 60 * 60,
  });

  if (isLoading || !game) {
    return (
      <div className="space-y-4">
        <div className="h-72 animate-pulse rounded-[2rem] bg-card/70" />
        <div className="h-40 animate-pulse rounded-3xl bg-card/70" />
      </div>
    );
  }

  const upcoming = game.released && new Date(game.released).getTime() > Date.now();

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative overflow-hidden rounded-[2rem] border border-border"
      >
        {game.background_image && (
          <img
            src={game.background_image}
            alt={game.name}
            className="absolute inset-0 size-full object-cover opacity-35"
          />
        )}
        <div className="relative bg-gradient-to-t from-card via-card/70 to-transparent p-6 pt-40 md:p-10 md:pt-56">
          <h1 className="font-display text-3xl font-black md:text-5xl">{game.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {gregorian(game.released)} · {hijri(game.released)}
          </p>
          {upcoming && (
            <div className="mt-4">
              <Countdown target={game.released} />
            </div>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            {addOptions.map((o) => (
              <Button
                key={o.v}
                size="sm"
                variant="secondary"
                className="rounded-xl"
                onClick={() => {
                  addGame(game, o.v);
                  toast.success(`أُضيفت إلى ${o.l}`);
                }}
              >
                {o.l}
              </Button>
            ))}
            {game.website && (
              <a href={game.website} target="_blank" rel="noreferrer">
                <Button size="sm" variant="ghost" className="rounded-xl">
                  <ExternalLink className="size-3.5" /> الموقع الرسمي
                </Button>
              </a>
            )}
          </div>
        </div>
      </motion.section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Info label="المطوّر" value={game.developers?.[0]?.name ?? "—"} />
        <Info label="الناشر" value={game.publishers?.[0]?.name ?? "—"} />
        <Info label="تقييم RAWG" value={String(game.rating ?? "—")} />
        <Info label="ميتاكريتيك" value={String(game.metacritic ?? "—")} />
        <Info label="التصنيفات" value={(game.genres ?? []).map((g) => g.name).join("، ") || "—"} />
        <Info
          label="المنصات"
          value={(game.platforms ?? []).map((p) => p.platform.name).join("، ") || "—"}
        />
        <Info label="التصنيف العمري" value={game.esrb_rating?.name ?? "—"} />
        <Info label="مدة اللعب التقديرية" value={`${num(game.playtime ?? 0)} ساعة`} />
      </section>

      {game.description_raw && (
        <section className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-2 font-display text-lg font-bold">القصة</h2>
          <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
            {game.description_raw}
          </p>
        </section>
      )}

      {!!shots?.length && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">الصور</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {shots.map((s) => (
              <img
                key={s.id}
                src={s.image}
                alt={game.name}
                loading="lazy"
                className="aspect-video w-full rounded-2xl object-cover surface-hover"
              />
            ))}
          </div>
        </section>
      )}

      {!!similar?.length && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">ألعاب مشابهة</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {similar.map((g) => (
              <Link
                key={g.id}
                to="/game/$id"
                params={{ id: String(g.id) }}
                className="overflow-hidden rounded-2xl border border-border bg-card surface-hover"
              >
                {g.background_image && (
                  <img
                    src={g.background_image}
                    alt={g.name}
                    loading="lazy"
                    className="aspect-video w-full object-cover"
                  />
                )}
                <p className="truncate p-3 text-xs font-bold">{g.name}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}
