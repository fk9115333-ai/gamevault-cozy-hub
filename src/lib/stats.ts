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
  const next = byStatus(entries, "next");
  const hype = byStatus(entries, "hype");
  const hours = entries.reduce((s, e) => s + (e.hours || 0), 0);
  const rated = entries.filter((e) => e.personalRating > 0);
  const genres = topOf(entries.flatMap((e) => e.genres));
  const sortedHours = [...completed].sort((a, b) => b.hours - a.hours);

  // الرسوم الزمنية تُقرأ من تاريخ الختم الفعلي
  const monthly = new Map<string, { games: number; hours: number }>();
  completed.forEach((e) => {
    if (!e.completedAt) return;
    const k = e.completedAt.slice(0, 7);
    const prev = monthly.get(k) ?? { games: 0, hours: 0 };
    monthly.set(k, { games: prev.games + 1, hours: prev.hours + e.hours });
  });

  const firstAt = [...entries].sort((a, b) => a.addedAt.localeCompare(b.addedAt))[0]?.addedAt;
  const days = firstAt
    ? Math.max(1, Math.ceil((Date.now() - new Date(firstAt).getTime()) / 86400000))
    : 1;
  const months = Math.max(1, Math.ceil(days / 30.4));

  return {
    total: entries.length,
    completed: completed.length,
    current: current.length,
    backlog: backlog.length,
    next: next.length,
    hype: hype.length,
    favorites: entries.filter((e) => e.favorite).length,
    coop: entries.filter((e) => e.coop).length,
    hours,
    avgRating: rated.length ? rated.reduce((s, e) => s + e.personalRating, 0) / rated.length : 0,
    completionRate: entries.length ? (completed.length / entries.length) * 100 : 0,
    topGenre: genres[0]?.[0] ?? "—",
    longest: sortedHours[0] ?? null,
    genres,
    monthly: [...monthly.entries()].sort().map(([month, v]) => ({ month, ...v })),
    backlogHours: backlog.reduce((s, e) => s + (e.playtimeEstimate || 10), 0),
    mostActiveMonth: [...monthly.entries()].sort((a, b) => b[1].games - a[1].games)[0]?.[0] ?? "—",
    avgDailyHours: hours / days,
    avgMonthlyCompleted: completed.length / months,
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
    make("coop", "لعبناها سوا", "أنهِ لعبة تعاونية مع أخوك", "🎮🎮", completed.filter((e) => e.coop).length, 1),
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

/** Ordered franchise entries used for smart "what to play next" suggestions. */
export const FRANCHISE_SERIES: { name: string; match: RegExp; order: string[] }[] = [
  {
    name: "Batman: Arkham",
    match: /batman|arkham/i,
    order: [
      "Batman: Arkham Asylum",
      "Batman: Arkham City",
      "Batman: Arkham Origins",
      "Batman: Arkham Knight",
    ],
  },
  {
    name: "Resident Evil",
    match: /resident evil/i,
    order: [
      "Resident Evil",
      "Resident Evil 2",
      "Resident Evil 3",
      "Resident Evil 4",
      "Resident Evil 5",
      "Resident Evil 6",
      "Resident Evil 7: Biohazard",
      "Resident Evil Village",
    ],
  },
  {
    name: "God of War",
    match: /god of war/i,
    order: ["God of War", "God of War II", "God of War III", "God of War (2018)", "God of War Ragnarök"],
  },
  {
    name: "Uncharted",
    match: /uncharted/i,
    order: [
      "Uncharted: Drake's Fortune",
      "Uncharted 2: Among Thieves",
      "Uncharted 3: Drake's Deception",
      "Uncharted 4: A Thief's End",
      "Uncharted: The Lost Legacy",
    ],
  },
  {
    name: "Marvel's Spider-Man",
    match: /spider-?man/i,
    order: ["Marvel's Spider-Man", "Marvel's Spider-Man: Miles Morales", "Marvel's Spider-Man 2"],
  },
  {
    name: "The Last of Us",
    match: /last of us/i,
    order: ["The Last of Us", "The Last of Us Part II"],
  },
  {
    name: "Silent Hill",
    match: /silent hill/i,
    order: ["Silent Hill 2", "Silent Hill 3", "Silent Hill 4: The Room", "Silent Hill: Downpour"],
  },
  {
    name: "Dead Space",
    match: /dead space/i,
    order: ["Dead Space", "Dead Space 2", "Dead Space 3"],
  },
  {
    name: "Grand Theft Auto",
    match: /grand theft auto|gta/i,
    order: ["Grand Theft Auto: San Andreas", "Grand Theft Auto IV", "Grand Theft Auto V"],
  },
  {
    name: "Assassin's Creed",
    match: /assassin'?s creed/i,
    order: [
      "Assassin's Creed II",
      "Assassin's Creed: Brotherhood",
      "Assassin's Creed IV: Black Flag",
      "Assassin's Creed Origins",
      "Assassin's Creed Odyssey",
      "Assassin's Creed Valhalla",
      "Assassin's Creed Mirage",
    ],
  },
];

export type FranchiseProgress = {
  name: string;
  total: number;
  done: number;
  hours: number;
  pct: number;
  suggestion: string | null;
};

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export function computeFranchises(entries: GameEntry[]): FranchiseProgress[] {
  return FRANCHISE_SERIES.map((f) => {
    const items = entries.filter((e) => f.match.test(e.name));
    const done = items.filter((e) => e.status === "completed");
    const owned = new Set(items.map((e) => norm(e.name)));
    const completedSet = new Set(done.map((e) => norm(e.name)));
    // suggest the next title in canonical order that isn't finished yet
    const suggestion =
      done.length > 0
        ? (f.order.find((t) => !completedSet.has(norm(t)) && !owned.has(norm(t))) ??
          f.order.find((t) => !completedSet.has(norm(t))) ??
          null)
        : null;
    return {
      name: f.name,
      total: items.length,
      done: done.length,
      hours: items.reduce((s, e) => s + e.hours, 0),
      pct: items.length ? (done.length / items.length) * 100 : 0,
      suggestion,
    };
  }).filter((f) => f.total > 0);
}

export const COLLECTIONS: { name: string; match: (e: GameEntry) => boolean }[] = [
  { name: "الرعب", match: (e) => e.genres.some((g) => /horror/i.test(g)) },
  { name: "قصة غنية", match: (e) => e.genres.some((g) => /adventure|rpg/i.test(g)) },
  { name: "عالم مفتوح", match: (e) => e.genres.some((g) => /action|adventure/i.test(g)) },
  { name: "RPG", match: (e) => e.genres.some((g) => /rpg/i.test(g)) },
  { name: "تصويب", match: (e) => e.genres.some((g) => /shooter/i.test(g)) },
  { name: "لعبناها سوا", match: (e) => e.coop },
  { name: "المفضلة", match: (e) => e.favorite },
];

export const activityIcon = (t: Activity["type"]) =>
  ({ start: "▶️", finish: "🏁", add: "➕", favorite: "⭐", achievement: "🏅", goal: "🎯" })[t];
