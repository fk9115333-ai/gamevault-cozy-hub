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

/** اختصارات شائعة يكتبها اللاعبون */
const ALIASES: [RegExp, string][] = [
  [/\bre\s*(\d+)\b/i, "resident evil $1"],
  [/\bre\b/i, "resident evil"],
  [/\bgta\b/i, "grand theft auto"],
  [/\bac\b/i, "assassin's creed"],
  [/\bcod\b/i, "call of duty"],
  [/\bmgs\s*(\d+|v)?\b/i, "metal gear solid $1"],
  [/\bgow\b/i, "god of war"],
  [/\btlou\b/i, "the last of us"],
  [/\bdmc\b/i, "devil may cry"],
  [/\brdr\s*(\d+)?\b/i, "red dead redemption $1"],
  [/\bff\s*(\d+|[ivx]+)\b/i, "final fantasy $1"],
  [/\bbg\s*3\b/i, "baldur's gate 3"],
  [/\bmk\b/i, "mortal kombat"],
  [/\bnfs\b/i, "need for speed"],
  [/\bsh\s*(\d+)\b/i, "silent hill $1"],
  [/\bgt\s*(\d+)\b/i, "gran turismo $1"],
  [/\bhzd\b/i, "horizon zero dawn"],
  [/\bfw\b/i, "horizon forbidden west"],
  [/\bsm\s*(\d+)?\b/i, "spider-man $1"],
  [/\bpubg\b/i, "playerunknown battlegrounds"],
  [/\bdbd\b/i, "dead by daylight"],
  [/\bds\s*(\d+)?\b/i, "dark souls $1"],
  [/\bwd\s*(\d+)?\b/i, "watch dogs $1"],
  [/\bcp\s*2077\b/i, "cyberpunk 2077"],
  [/\bgow\s*r\b/i, "god of war ragnarok"],
];

const expandQuery = (q: string) => {
  const raw = q.trim();
  const variants = new Set<string>([raw]);
  for (const [re, rep] of ALIASES) {
    if (re.test(raw)) variants.add(raw.replace(re, rep).replace(/\s+/g, " ").trim());
  }
  return [...variants].slice(0, 3);
};

const norm = (s: string) =>
  s.toLowerCase().replace(/['’:\-–—.,!?]/g, "").replace(/\s+/g, " ").trim();

/** تطابق تسلسلي ضبابي (ykuza → yakuza) */
const subsequence = (needle: string, hay: string) => {
  let i = 0;
  for (const ch of hay) if (ch === needle[i]) i++;
  return i === needle.length;
};

/** درجة تطابق ضبابية: بادئة > احتواء > تطابق كلمات جزئي > تسلسل حروف */
const matchScore = (name: string, queries: string[]) => {
  const n = norm(name);
  const words = n.split(" ");
  let best = 0;
  for (const q of queries) {
    const nq = norm(q);
    if (!nq) continue;
    if (n === nq) best = Math.max(best, 1000);
    else if (n.startsWith(nq)) best = Math.max(best, 850);
    else if (words.some((w) => w === nq)) best = Math.max(best, 720);
    else if (n.includes(nq)) best = Math.max(best, 640);
    const tokens = nq.split(" ").filter(Boolean);
    if (tokens.length) {
      const hits = tokens.filter((t) => words.some((w) => w.startsWith(t))).length;
      const loose = tokens.filter((t) => words.some((w) => w.includes(t))).length;
      best = Math.max(best, Math.round((hits / tokens.length) * 560));
      best = Math.max(best, Math.round((loose / tokens.length) * 380));
    }
    if (best === 0 && nq.length >= 4 && subsequence(nq.replace(/ /g, ""), n.replace(/ /g, "")))
      best = Math.max(best, 200);
  }
  return best;
};


/** لعبة لم تصدر بعد (تاريخ مستقبلي أو TBA) */
export const isUnreleased = (g: RawgGame) =>
  !!g.tba || !g.released || new Date(g.released).getTime() > Date.now();

/** لعبة مرتقبة مقبولة: ليست جوال صريحًا، ولها اسم أساسي */
const isUpcomingCandidate = (g: RawgGame) => {
  if (!isUnreleased(g)) return false;
  if (!isBaseGame(g.name)) return false;
  const platforms = g.platforms ?? [];
  if (!platforms.length) return true; // إعلان مبكر بلا منصات محددة
  return isCoreGame(g);
};

/** سلاسل كبرى تُقترح فور كتابة أول حروفها (Res → resident evil) */
const FRANCHISE_TERMS = [
  "resident evil",
  "batman arkham",
  "assassin's creed",
  "grand theft auto",
  "god of war",
  "the last of us",
  "ghost of tsushima",
  "metal gear solid",
  "final fantasy",
  "silent hill",
  "red dead redemption",
  "call of duty",
  "elden ring",
  "dark souls",
  "spider-man",
  "horizon",
  "uncharted",
  "the witcher",
  "cyberpunk 2077",
  "death stranding",
  "devil may cry",
  "monster hunter",
  "mortal kombat",
  "tomb raider",
  "far cry",
  "battlefield",
  "hogwarts legacy",
  "baldur's gate",
  "starfield",
  "sekiro",
  "bloodborne",
  "days gone",
  "alan wake",
  "returnal",
  "pragmata",
  "mass effect",
  "fallout",
  "the elder scrolls",
  "doom",
  "halo",
  "gears of war",
  "persona",
  "nier",
  "hitman",
  "dishonored",
  "control",
  "bioshock",
  "borderlands",
  "diablo",
  "forza",
  "gran turismo",
  "street fighter",
  "tekken",
  "the phantom pain",
  "phantom liberty",
  "silksong",
  "kingdom come deliverance",
  "dragon age",
  "dragon's dogma",
  "yakuza like a dragon",
  "like a dragon",
  "star wars jedi",
  "a plague tale",
  "it takes two",
  "split fiction",
  "black myth wukong",
  "clair obscur expedition 33",
  "stellar blade",
  "lies of p",
  "armored core",
  "wolverine",
  "grand theft auto vi",
  "death stranding 2",
  "resident evil requiem",
  "the witcher 4",
  "intergalactic the heretic prophet",
];

/** يوسّع البادئات القصيرة إلى أسماء السلاسل الكبرى */
const franchiseMatches = (q: string) => {
  const n = norm(q);
  if (n.length < 2) return [];
  return FRANCHISE_TERMS.filter(
    (f) => f.startsWith(n) || f.split(" ").some((w) => w.startsWith(n) && n.length >= 3),
  ).slice(0, 3);
};

export const searchGames = async (q: string, limit = 12) => {
  const raw = q.trim();
  if (raw.length < 2) return [] as RawgGame[];
  const queries = [...new Set([...expandQuery(raw), ...franchiseMatches(raw)])].slice(0, 4);

  const fetchQuery = (query: string, extra: Record<string, string | number> = {}) =>
    rawg<{ results: RawgGame[] }>("/games", {
      search: query,
      page_size: 40,
      ordering: "-added",
      exclude_collection: "true",
      exclude_additions: "true",
      ...extra,
    })
      .then((d) => d.results)
      .catch(() => [] as RawgGame[]);

  const batches = await Promise.all([
    // الفهرس الأساسي: PC + بلايستيشن + بقية المنصات الكبرى
    ...queries.map((query) =>
      fetchQuery(query, { platforms: PLATFORMS, parent_platforms: PARENT_PLATFORMS }),
    ),
    // فهرس موسّع بلا قيود منصة لالتقاط الإعلانات والألعاب المرتقبة (تُفلتر محليًا)
    fetchQuery(raw, { search_precise: "true" }),
    fetchQuery(raw, { page_size: 20 }),
  ]);

  const unique = new Map<number, RawgGame>();
  for (const g of batches.flat()) if (!unique.has(g.id)) unique.set(g.id, g);

  const all = [...unique.values()];
  const clean = cleanList(all);
  const upcoming = all.filter((g) => isUpcomingCandidate(g) && !clean.some((c) => c.id === g.id));

  // نستبعد الحشو المغمور إلا إذا كان سلسلة كبرى أو لعبة مرتقبة
  const pool = [...clean, ...upcoming].filter(
    (g) => hasSubstance(g) || MASTER_FRANCHISES.test(g.name) || isUnreleased(g),
  );

  const franchiseHint = franchiseMatches(raw);
  const nq = norm(raw);

  return pool
    .map((g) => {
      const n = norm(g.name);
      const s = matchScore(g.name, queries);
      // تطابق حرفي أو بادئة حرفية لما كتبه المستخدم يتصدّر دائمًا (أسلوب Steam)
      const exact = n === nq ? 100000 : n.startsWith(nq) ? 40000 : 0;
      const wordPrefix = !exact && n.split(" ").some((w) => w.startsWith(nq)) ? 8000 : 0;
      const bonus =
        exact +
        wordPrefix +
        (MASTER_FRANCHISES.test(g.name) ? 400 : 0) +
        (franchiseHint.some((f) => norm(g.name).startsWith(norm(f))) ? 500 : 0) +
        (isUnreleased(g) && MASTER_FRANCHISES.test(g.name) ? 200 : 0);
      return { g, s: s + bonus, base: s };
    })
    .filter((x) => x.base > 0)
    .sort((a, b) => b.s + prestige(b.g) / 20 - (a.s + prestige(a.g) / 20))
    .slice(0, limit)
    .map((x) => x.g);
};




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

