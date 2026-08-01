import type { GameEntry } from "./store";

export type CompletionSummary = {
  hours: number;
  days: number | null;
  dailyAvg: number | null;
  startedAt: string | null;
  completedAt: string | null;
  sessions: number;
  badge: { label: string; emoji: string; hint: string };
};

/** شارة اللاعب حسب سرعة الختم ومتوسط اللعب اليومي */
function pacingBadge(days: number | null, dailyAvg: number | null, hours: number) {
  if (days !== null && days <= 3) return { label: "ختمة سريعة", emoji: "⚡", hint: "أنهيتها بسرعة البرق" };
  if (dailyAvg !== null && dailyAvg >= 5) return { label: "ماراثون", emoji: "🔥", hint: "جلسات طويلة بلا توقف" };
  if (hours >= 60) return { label: "ختمة استكشافية", emoji: "🗺️", hint: "استكشفت كل زاوية" };
  if (days !== null && days >= 45) return { label: "ختمة صبورة", emoji: "🐢", hint: "على راحتك، خطوة بخطوة" };
  return { label: "ختمة متوازنة", emoji: "🎯", hint: "إيقاع مثالي" };
}

/** يحسب بطاقة الختم التفصيلية من بيانات اللعبة المخزّنة */
export function completionSummary(entry: GameEntry): CompletionSummary {
  const firstSession = [...entry.sessions].sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""))[0];
  const startedAt = entry.startedAt ?? (firstSession?.date ? new Date(firstSession.date).toISOString() : null);
  const completedAt = entry.completedAt;

  let days: number | null = null;
  if (startedAt) {
    const end = completedAt ? new Date(completedAt) : new Date();
    const diff = Math.round((end.getTime() - new Date(startedAt).getTime()) / 86400000);
    days = Math.max(1, diff);
  }

  const hours = Math.round(entry.hours * 10) / 10;
  const dailyAvg = days && hours > 0 ? Math.round((hours / days) * 10) / 10 : null;

  return {
    hours,
    days,
    dailyAvg,
    startedAt,
    completedAt,
    sessions: entry.sessions.length,
    badge: pacingBadge(days, dailyAvg, hours),
  };
}
