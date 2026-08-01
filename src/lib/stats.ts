import type { GameEntry, Activity } from "./store";

export const byStatus = (entries: GameEntry[], status: GameEntry["status"]) =>
  entries.filter((e) => e.status === status);

const topOf = (values: (string | null | undefined)[]) => {
  const map = new Map<string, number>();
  values.filter(Boolean).forEach((v) => map.set(v as string, (map.get(v as string) ?? 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
};

export function computeStats(entries: GameEntry[]) {
  const completed = byStatus(entries, "completed");
  const current = byStatus(entries, "current");
  const backlog = byStatus(entries, "backlog");
  const wishlist = byStatus(entries, "wishlist");
  const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const rated = entries.filter((e) => e.personalRating > 0);
  const genres = topOf(entries.flatMap((e) => e.genres));
  const platforms = topOf(entries.map((e) => e.platform || e.platforms[0]));
  const developers = topOf(entries.map((e) => e.developer));
  const publishers = topOf(entries.map((e) => e.publisher));
  const sortedHours = [...completed].sort((a, b) => b.hours - a.hours);

  const monthly = new Map<string, { games: number; hours: number }>();
  completed.forEach((e) => {
    if (!e.completedAt) return;
    const k = e.completedAt.slice(0, 7);
    const prev = monthly.get(k) ?? { games: 0, hours: 0 };
    monthly.set(k, { games: prev.games + 1, hours: prev.hours + e.hours });
  });

  return {
    total: entries.length,
    completed: completed.length,
    current: current.length,
    backlog: backlog.length,
    wishlist: wishlist.length,
    favorites: entries.filter((e) => e.favorite).length,
    hours,
    avgRating: rated.length ? rated.reduce((s, e) => s + e.personalRating, 0) / rated.length : 0,
    completionRate: entries.length ? (completed.length / entries.length) * 100 : 0,
    topGenre: genres[0]?.[0] ?? "—",
    topPlatform: platforms[0]?.[0] ?? "—",
    topDeveloper: developers[0]?.[0] ?? "—",
    topPublisher: publishers[0]?.[0] ?? "—",
    longest: sortedHours[0] ?? null,
    shortest: sortedHours.filter((g) => g.hours > 0).at(-1) ?? null,
    genres,
    platforms,
    monthly: [...monthly.entries()].sort().map(([month, v]) => ({ month, ...v })),
    backlogHours: backlog.reduce((s, e) => s + (e.playtimeEstimate || 10), 0),
    mostActiveMonth:
      [...monthly.entries()].sort((a, b) => b[1].games - a[1].games)[0]?.[0] ?? "—",
  };
}

export type Achievement = {
  id: string;
  title: string;
  desc: string;
  icon: string;
  unlocked: boolean;
  progress: number;
};

export function computeAchievements(entries: GameEntry[]): Achievement[] {
  const completed = byStatus(entries, "completed");
  const hours = entries.reduce((s, e) => s + e.hours, 0);
  const horror = completed.filter((e) => e.genres.some((g) => /horror/i.test(g)));
  const franchise = (re: RegExp) => completed.filter((e) => re.test(e.name)).length;

  const make = (
    id: string,
    title: string,
    desc: string,
    icon: string,
    value: number,
    target: number,
  ): Achievement => ({
    id,
    title,
    desc,
    icon,
    unlocked: value >= target,
    progress: Math.min(100, (value / target) * 100),
  });

  return [
    make("first", "اللعبة الأولى", "أنهِ أول لعبة", "🎯", completed.length, 1),
    make("horror", "أول لعبة رعب", "أنهِ أول لعبة رعب", "👻", horror.length, 1),
    make("platinum", "أول بلاتينيوم", "أكمل لعبة بنسبة 100%", "🏆", completed.filter((e) => e.fullCompletion).length, 1),
    make("h100", "100 ساعة", "العب 100 ساعة", "⏱️", hours, 100),
    make("h500", "500 ساعة", "العب 500 ساعة", "🔥", hours, 500),
    make("h1000", "1000 ساعة", "العب 1000 ساعة", "💎", hours, 1000),
    make("g10", "10 ألعاب", "أنهِ 10 ألعاب", "🎮", completed.length, 10),
    make("g25", "25 لعبة", "أنهِ 25 لعبة", "🕹️", completed.length, 25),
    make("g50", "50 لعبة", "أنهِ 50 لعبة", "🚀", completed.length, 50),
    make("g100", "100 لعبة", "أنهِ 100 لعبة", "👑", completed.length, 100),
    make("re", "سيد Resident Evil", "أنهِ 5 من سلسلة Resident Evil", "🧟", franchise(/resident evil/i), 5),
    make("sh", "سيد Silent Hill", "أنهِ 3 من سلسلة Silent Hill", "🌫️", franchise(/silent hill/i), 3),
    make("collector", "جامع الألعاب", "اجمع 50 لعبة في المكتبة", "📚", entries.length, 50),
    make("completionist", "المكمّل", "أكمل 10 ألعاب بنسبة 100%", "✨", completed.filter((e) => e.fullCompletion).length, 10),
  ];
}

export const FRANCHISES = [
  "Resident Evil",
  "Silent Hill",
  "GTA",
  "God of War",
  "Spider-Man",
  "Batman",
  "Assassin's Creed",
  "Need for Speed",
  "Battlefield",
  "Call of Duty",
  "Far Cry",
  "Dead Space",
  "BioShock",
  "Metal Gear",
  "Uncharted",
];

export const COLLECTIONS: { name: string; match: (e: GameEntry) => boolean }[] = [
  { name: "الرعب", match: (e) => e.genres.some((g) => /horror/i.test(g)) },
  { name: "قصة غنية", match: (e) => e.genres.some((g) => /adventure|rpg/i.test(g)) },
  { name: "عالم مفتوح", match: (e) => e.genres.some((g) => /action|adventure/i.test(g)) },
  { name: "RPG", match: (e) => e.genres.some((g) => /rpg/i.test(g)) },
  { name: "تصويب", match: (e) => e.genres.some((g) => /shooter/i.test(g)) },
  { name: "متعدد اللاعبين", match: (e) => e.genres.some((g) => /multiplayer|sports/i.test(g)) },
  { name: "PlayStation", match: (e) => e.platforms.some((p) => /playstation/i.test(p)) },
  { name: "Xbox", match: (e) => e.platforms.some((p) => /xbox/i.test(p)) },
  { name: "Nintendo", match: (e) => e.platforms.some((p) => /nintendo/i.test(p)) },
  { name: "المفضلة", match: (e) => e.favorite },
];

export const activityIcon = (t: Activity["type"]) =>
  ({ start: "▶️", finish: "🏁", add: "➕", favorite: "⭐", achievement: "🏅", goal: "🎯" })[t];
