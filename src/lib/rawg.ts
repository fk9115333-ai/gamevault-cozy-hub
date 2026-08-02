const RAWG_KEY = "4ea2968a10604ee0bacd122f1ad00cee";
const BASE = "https://api.rawg.io/api";

/** PC · PS4 · PS5 · Xbox One · Xbox Series X|S · Nintendo Switch */
export const PLATFORMS = "4,18,187,1,186,7";

/** منصات رئيسية (PC · PlayStation · Xbox · Nintendo) — تستبعد الجوال */
export const PARENT_PLATFORMS = "1,2,3,7";

/** القائمة البيضاء الوحيدة: PC · PS4 · PS5 · Xbox One/Series · Switch */
const ALLOWED_PLATFORM_IDS = new Set([4, 18, 187, 1, 186, 7]);
const BANNED_PLATFORM_SLUGS = /android|ios|web|mobile/i;

export type RawgGame = {
  id: number;
  slug: string;
  name: string;
  released: string | null;
  tba?: boolean;
  background_image: string | null;
  background_image_additional?: string | null;
  rating: number;
  ratings_count?: number;
  added?: number;
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

/** قائمة بيضاء صارمة: أي منصة جوال/ويب أو منصة خارج المحدد ترفض اللعبة كاملة. */
export const isCoreGame = (g: RawgGame) => {
  const platforms = g.platforms ?? [];
  if (!platforms.length) return false;
  return platforms.every(
    ({ platform }) =>
      ALLOWED_PLATFORM_IDS.has(platform.id) &&
      !BANNED_PLATFORM_SLUGS.test(`${platform.slug} ${platform.name}`),
  );
};

/** سلاسل كبرى تُرفع دائمًا لأعلى نتائج البحث والتوصيات */
const MASTER_FRANCHISES =
  /\b(resident evil|metal gear|batman: ?arkham|arkham|god of war|the last of us|uncharted|horizon|spider-?man|ghost of tsushima|elden ring|dark souls|bloodborne|sekiro|final fantasy|silent hill|red dead|grand theft auto|gta|assassin'?s creed|far cry|cyberpunk|the witcher|mass effect|dragon age|halo|gears of war|doom|call of duty|battlefield|death stranding|hitman|tomb raider|dishonored|fallout|the elder scrolls|skyrim|hogwarts|baldur'?s gate|starfield|forza|it takes two|a plague tale|alan wake|control|returnal|ratchet|gran turismo|nier|persona|monster hunter|devil may cry|street fighter|tekken|mortal kombat|pragmata|silksong|days gone|infamous|bioshock|borderlands|diablo|stalker|kingdom come|expedition 33)\b/i;

/** رتبة الجودة: السلاسل الكبرى ثم التقييم النقدي ثم الشعبية */
const prestige = (g: RawgGame) =>
  (MASTER_FRANCHISES.test(g.name) ? 100000 : 0) +
  (g.metacritic ?? 0) * 200 +
  Math.min(60000, g.added ?? 0);

const byPrestige = (a: RawgGame, b: RawgGame) => prestige(b) - prestige(a);

/** فلترة موحّدة: لعبة أساسية + منصات رئيسية */
export const cleanList = (list: RawgGame[]) =>
  list.filter((g) => isBaseGame(g.name) && isCoreGame(g));

/** يستبعد الحشو المغمور: بلا صورة وبلا جمهور ولا تقييم نقدي */
const hasSubstance = (g: RawgGame) =>
  !!g.background_image && ((g.added ?? 0) >= 200 || (g.metacritic ?? 0) >= 70 || (g.ratings_count ?? 0) >= 60);

export const searchGames = (q: string) =>
  rawg<{ results: RawgGame[] }>("/games", {
    search: q,
    page_size: 40,
    search_precise: "true",
    platforms: PLATFORMS,
    parent_platforms: PARENT_PLATFORMS,
    ordering: "-added",
    exclude_collection: "true",
    exclude_additions: "true",
  }).then((d) => {
    const clean = cleanList(d.results);
    const strong = clean.filter(hasSubstance);
    return (strong.length ? strong : clean).sort(byPrestige).slice(0, 12);
  });


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
    page_size: 24,
    platforms: PLATFORMS,
    parent_platforms: PARENT_PLATFORMS,
    exclude_collection: "true",
    exclude_additions: "true",
    dates: `${new Date().getFullYear() - 2}-01-01,${new Date().toISOString().slice(0, 10)}`,
  }).then((d) => cleanList(d.results).filter(hasSubstance).sort(byPrestige).slice(0, 12));

/** إصدارات مرتقبة كبرى فقط (PC/PlayStation) */
export const getUpcoming = () =>
  rawg<{ results: RawgGame[] }>("/games", {
    ordering: "-added",
    page_size: 40,
    platforms: PLATFORMS,
    parent_platforms: PARENT_PLATFORMS,
    exclude_collection: "true",
    exclude_additions: "true",
    dates: `${new Date().toISOString().slice(0, 10)},${new Date().getFullYear() + 3}-12-31`,
  })
    .then((d) => cleanList(d.results).filter((g) => !!g.background_image).sort(byPrestige).slice(0, 15))
    .catch(() => [] as RawgGame[]);

/** جلب لعبة بالمُعرّف النصي (slug) — للاستيراد الجماعي */
export const getGameBySlug = (slug: string) => rawg<RawgGame>(`/games/${slug}`);

const CURATED_AAA_SLUGS = [
  "god-of-war-2",
  "god-of-war-ragnarok",
  "elden-ring",
  "cyberpunk-2077",
  "baldurs-gate-3",
  "marvels-spider-man-2",
  "red-dead-redemption-2",
  "ghost-of-tsushima",
  "the-last-of-us-part-2",
  "resident-evil-4-2023",
  "resident-evil-2-2019",
  "resident-evil-village",
  "batman-arkham-knight",
  "batman-arkham-city-2",
  "metal-gear-solid-v-the-phantom-pain",
  "sekiro-shadows-die-twice",
  "bloodborne",
  "dark-souls-iii",
  "horizon-forbidden-west",
  "the-witcher-3-wild-hunt",
  "death-stranding",
  "uncharted-4-a-thiefs-end",
  "a-plague-tale-requiem",
  "alan-wake-2",
  "hogwarts-legacy",
  "control",
  "nier-automata",
  "final-fantasy-vii-remake",
  "returnal",
  "star-wars-jedi-survivor",
] as const;


const PREMIUM_GENRES = new Set(["action", "role-playing-games-rpg", "adventure", "shooter"]);

/** بوابة جودة إضافية تمنع الألعاب العشوائية أو الخفيفة من صف التوصيات. */
const isPremiumRecommendation = (game: RawgGame) => {
  const genreMatch = (game.genres ?? []).some((genre) => PREMIUM_GENRES.has(genre.slug));
  const criticallyAcclaimed = (game.metacritic ?? 0) >= 82;
  const broadlyRated = game.rating >= 4.1 && (game.ratings_count ?? 0) >= 750;
  return isBaseGame(game.name) && isCoreGame(game) && !!game.background_image && genreMatch && (criticallyAcclaimed || broadlyRated);
};

export type RecommendationExclusions = {
  ids?: Iterable<number>;
  names?: Iterable<string>;
};

const normalizedName = (name: string) => name.trim().toLocaleLowerCase();

/**
 * توصيات ثقيلة وموثوقة: نتائج شخصية عالية التقييم، ثم قائمة AAA منتقاة كضمان.
 * الاستبعاد يطبق هنا، ويعاد تطبيقه في الواجهة كطبقة أمان ثانية.
 */
export const getRecommended = async (
  genreSlugs: string[] = [],
  exclusions: RecommendationExclusions = {},
) => {
  const excludedIds = new Set(exclusions.ids ?? []);
  const excludedNames = new Set(
    [...(exclusions.names ?? [])].map(normalizedName),
  );
  const excludeOwned = (game: RawgGame) =>
    !excludedIds.has(game.id) && !excludedNames.has(normalizedName(game.name));

  const dynamicRequest = rawg<{ results: RawgGame[] }>("/games", {
    ...(genreSlugs.length ? { genres: genreSlugs.slice(0, 4).join(",") } : {}),
    ordering: "-metacritic",
    metacritic: "82,100",
    page_size: 40,
    platforms: PLATFORMS,
    parent_platforms: PARENT_PLATFORMS,
    exclude_collection: "true",
    exclude_additions: "true",
    dates: `${new Date().getFullYear() - 12}-01-01,${new Date().toISOString().slice(0, 10)}`,
  })
    .then(({ results }) => results.filter(isPremiumRecommendation))
    .catch(() => [] as RawgGame[]);

  const curatedRequest = Promise.allSettled(
    CURATED_AAA_SLUGS.map((slug) => rawg<RawgGame>(`/games/${slug}`)),
  ).then((results) =>
    results.flatMap((result) =>
      result.status === "fulfilled" && isPremiumRecommendation(result.value) ? [result.value] : [],
    ),
  );

  const [dynamic, curated] = await Promise.all([dynamicRequest, curatedRequest]);
  const merged = [...curated, ...dynamic];
  const unique = new Map<number, RawgGame>();
  for (const game of merged) if (excludeOwned(game) && !unique.has(game.id)) unique.set(game.id, game);
  return [...unique.values()].sort(byPrestige).slice(0, 18);
};

