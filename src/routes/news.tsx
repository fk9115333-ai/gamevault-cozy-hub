import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "motion/react";
import { Newspaper, ExternalLink } from "lucide-react";
import { getGamingNews } from "@/lib/news.functions";
import { SectionTitle, EmptyState } from "@/components/ui-bits";
import { hijri } from "@/lib/dates";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "أخبار الجيمرز — GameHub" },
      {
        name: "description",
        content: "آخر أخبار الألعاب بالعربي من TrueGaming وسعودي جيمر، محدّثة لحظيًا.",
      },
      { property: "og:title", content: "أخبار الجيمرز — GameHub" },
      { property: "og:description", content: "عناوين الألعاب العربية الحيّة في مكان واحد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const fetchNews = useServerFn(getGamingNews);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gaming-news"],
    queryFn: () => fetchNews(),
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div className="space-y-5">
      <SectionTitle title="أخبار الجيمرز" subtitle="مباشرة من أشهر المواقع العربية" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl border border-border bg-card" />
          ))}
        </div>
      ) : isError || !data?.length ? (
        <EmptyState text="تعذّر جلب الأخبار الآن — حاول لاحقًا." />
      ) : (
        <div className="space-y-3">
          {data.map((n, i) => (
            <motion.a
              key={n.id}
              href={n.link}
              target="_blank"
              rel="noreferrer noopener"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 surface-hover"
            >
              {n.image ? (
                <img
                  src={n.image}
                  alt=""
                  loading="lazy"
                  className="size-20 shrink-0 rounded-xl object-cover"
                />
              ) : (
                <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-secondary">
                  <Newspaper className="size-6 text-primary" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-bold leading-snug">{n.title}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {n.source}
                  {n.date ? ` · ${hijri(n.date)}` : ""}
                </p>
              </div>
              <ExternalLink className="size-4 shrink-0 text-primary" />
            </motion.a>
          ))}
        </div>
      )}
    </div>
  );
}
