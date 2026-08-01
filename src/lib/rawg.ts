const RAWG_KEY = "4ea2968a10604ee0bacd122f1ad00cee";
const BASE = "https://api.rawg.io/api";

export type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  tba?: boolean;
  background_image: string | null;
  background_image_additional?: string | null;
  rating: number;
  metacritic: number | null;
  playtime?: number;
  website?: string;
  description_raw?: string;
  esrb_rating?: { name: string } | null;
  platforms?: { platform: { id: number; name: string; slug: string } }[];
  genres?: { id: number; name: string; slug: string }[];
  developers?: { id: number; name: string }[];
  publishers?: { id: number; name: string }[];
  short_screenshots?: { id: number; image: string }[];
};

async function rawg<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("key", RAWG_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("تعذر الاتصال بقاعدة بيانات الألعاب");
  return (await res.json()) as T;
}

export const searchGames = (q: string) =>
  rawg<{ results: RawgGame[] }>("/games", { search: q, page_size: 12, search_precise: "true" }).then(
    (d) => d.results,
  );

export const getGame = (id: string | number) => rawg<RawgGame>(`/games/${id}`);

export const getScreenshots = (id: string | number) =>
  rawg<{ results: { id: number; image: string }[] }>(`/games/${id}/screenshots`).then(
    (d) => d.results,
  );

export const getSimilar = (id: string | number) =>
  rawg<{ results: RawgGame[] }>(`/games/${id}/game-series`, { page_size: 8 })
    .then((d) => d.results)
    .catch(() => []);

export const getUpcoming = () => {
  const today = new Date().toISOString().slice(0, 10);
  const next = new Date(Date.now() + 1000 * 60 * 60 * 24 * 730).toISOString().slice(0, 10);
  return rawg<{ results: RawgGame[] }>("/games", {
    dates: `${today},${next}`,
    ordering: "released",
    page_size: 24,
  }).then((d) => d.results);
};

export const getTrending = () =>
  rawg<{ results: RawgGame[] }>("/games", {
    ordering: "-added",
    page_size: 12,
    dates: `${new Date().getFullYear() - 2}-01-01,${new Date().toISOString().slice(0, 10)}`,
  }).then((d) => d.results);
