import { createServerFn } from "@tanstack/react-start";

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: string;
  date: string | null;
  image: string | null;
  excerpt: string;
};

const FEEDS: { name: string; url: string }[] = [
  { name: "TrueGaming", url: "https://www.true-gaming.net/home/feed/" },
  { name: "سعودي جيمر", url: "https://saudigamer.com/feed" },
];

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const pick = (block: string, tag: string) => {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decode(m[1]!) : "";
};

function parseFeed(xml: string, source: string): NewsItem[] {
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  return items.slice(0, 12).map((block, i) => {
    const title = pick(block, "title");
    const link = pick(block, "link");
    const raw = block.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i)?.[1] ?? block;
    const image =
      block.match(/<media:content[^>]+url="([^"]+)"/i)?.[1] ??
      block.match(/<enclosure[^>]+url="([^"]+)"/i)?.[1] ??
      raw.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1] ??
      null;
    const pubDate = pick(block, "pubDate");
    return {
      id: `${source}-${i}-${link}`,
      title,
      link,
      source,
      date: pubDate ? new Date(pubDate).toISOString() : null,
      image,
      excerpt: pick(block, "description").slice(0, 180),
    };
  });
}

/** أخبار الألعاب العربية من مصادر RSS موثوقة */
export const getGamingNews = createServerFn({ method: "GET" }).handler(async (): Promise<NewsItem[]> => {
  const results = await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, {
          headers: { "user-agent": "Mozilla/5.0 GameHub/1.0", accept: "application/rss+xml,text/xml" },
        });
        if (!res.ok) return [];
        return parseFeed(await res.text(), f.name);
      } catch {
        return [];
      }
    }),
  );

  return results
    .flat()
    .filter((n) => n.title && n.link)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
    .slice(0, 24);
});
