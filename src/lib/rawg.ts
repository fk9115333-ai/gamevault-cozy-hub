const RAWG_KEY = "4ea2968a10604ee0bacd122f1ad00cee";
const BASE = "https://api.rawg.io/api";

/** PC · PS4 · PS5 · Xbox One · Xbox Series X|S · Nintendo Switch */
export const PLATFORMS = "4,18,187,1,186,7";

/** منصات رئيسية (PC · PlayStation · Xbox · Nintendo) — تستبعد الجوال */
export const PARENT_PLATFORMS = "1,2,3,7";

/** معرّفات منصات الجوال (iOS · Android) */
const MOBILE_PLATFORM_IDS = new Set([3, 21]);
const CORE_PLATFORM_IDS = new Set([4, 18, 187, 1, 186, 7, 14, 16, 15, 27, 8, 9, 10, 5, 6, 83, 24, 43, 11]);

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

/** إصدارات غير أساسية — نعرض النسخة الأساسية فقط */
const EDITION_NOISE =
  /\b(edition|goty|game of the year|deluxe|ultimate|bundle|director'?s cut|premium|remastered)\b/i;

/** إضافات ومحتوى إضافي (DLC) — تُستبعد نهائيًا */
const DLC_NOISE =
  /\b(dlc|add-?on|expansion|expansion pass|season pass|story pack|character pack|content pack|mission pack|map pack|skin pack|weapon pack|booster|pack)\b/i;

export const isBaseGame = (name: string) => !EDITION_NOISE.test(name) && !DLC_NOISE.test(name);

/** ألعاب الجوال ممنوعة — نقبل فقط ما يصدر على PC أو الأجهزة المنزلية */
export const isCoreGame = (g: RawgGame) => {
  const ids = (g.platforms ?? []).map((p) => p.platform.id);
  if (!ids.length) return true;
  if (!ids.some((id) => CORE_PLATFORM_IDS.has(id))) return false;
  // لعبة جوال بحتة (iOS/Android فقط)
  return !ids.every((id) => MOBILE_PLATFORM_IDS.has(id));
};

/** فلترة موحّدة: لعبة أساسية + منصات رئيسية */
export const cleanList = (list: RawgGame[]) =>
  list.filter((g) => isBaseGame(g.name) && isCoreGame(g));


export const searchGames = (q: string) =>
  rawg<{ results: RawgGame[] }>("/games", {
    search: q,
    page_size: 20,
    search_precise: "true",
    platforms: PLATFORMS,
    parent_platforms: PARENT_PLATFORMS,
    ordering: "-added",
    exclude_collection: "true",
    exclude_additions: "true",
  }).then((d) => cleanList(d.results).slice(0, 12));

export const getGame = (id: string | number) => rawg<RawgGame>(`/games/${id}`);

export const getScreenshots = (id: string | number) =>
  rawg<{ results: { id: number; image: string }[] }>(`/games/${id}/screenshots`).then(
    (d) => d.results,
  );

export const getSimilar = (id: string | number) =>
  rawg<{ results: RawgGame[] }>(`/games/${id}/game-series`, { page_size: 8 })
    .then((d) => cleanList(d.results))
    .catch(() => []);

export const getTrending = () =>
  rawg<{ results: RawgGame[] }>("/games", {
    ordering: "-added",
    page_size: 12,
    platforms: PLATFORMS,
    parent_platforms: PARENT_PLATFORMS,
    exclude_collection: "true",
    exclude_additions: "true",
    dates: `${new Date().getFullYear() - 2}-01-01,${new Date().toISOString().slice(0, 10)}`,
  }).then((d) => cleanList(d.results));

/** توصيات ذكية بناءً على أنواع الألعاب المكتملة — أو أفضل الألعاب عند عدم وجود سجل */
export const getRecommended = (genreSlugs: string[] = []) =>
  rawg<{ results: RawgGame[] }>("/games", {
    ...(genreSlugs.length ? { genres: genreSlugs.slice(0, 4).join(",") } : {}),
    ordering: "-metacritic",
    metacritic: "82,100",
    page_size: 30,
    platforms: PLATFORMS,
    parent_platforms: PARENT_PLATFORMS,
    exclude_collection: "true",
    exclude_additions: "true",
    dates: `${new Date().getFullYear() - 12}-01-01,${new Date().toISOString().slice(0, 10)}`,
  }).then((d) => cleanList(d.results).filter((g) => !!g.background_image));
