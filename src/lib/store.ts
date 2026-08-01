import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RawgGame } from "./rawg";

export type UserId = "faisal" | "mishal";
export type Status = "current" | "completed" | "backlog" | "wishlist";
export type Priority = "high" | "medium" | "low";

export type GameEntry = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  released: string | null;
  rating: number;
  metacritic: number | null;
  platforms: string[];
  genres: string[];
  developer: string | null;
  publisher: string | null;
  playtimeEstimate: number;
  status: Status;
  favorite: boolean;
  favoriteOrder: number;
  progress: number;
  hours: number;
  personalRating: number;
  review: string;
  notes: string;
  bestMoment: string;
  worstMoment: string;
  difficulty: string;
  platform: string;
  priority: Priority;
  price: number;
  achievements: number;
  replays: number;
  fullCompletion: boolean;
  startedAt: string | null;
  completedAt: string | null;
  addedAt: string;
};

export type Activity = {
  id: string;
  type: "start" | "finish" | "add" | "favorite" | "achievement" | "goal";
  text: string;
  at: string;
};

export type Goal = { id: string; title: string; target: number; current: number; unit: string };

export type Profile = {
  name: string;
  avatar: string;
  bio: string;
  favoriteGame: string;
  favoritePlatform: string;
  favoriteGenre: string;
};

type UserData = { profile: Profile; entries: GameEntry[]; activities: Activity[]; goals: Goal[] };

type State = {
  currentUser: UserId;
  users: Record<UserId, UserData>;
  setUser: (u: UserId) => void;
  addGame: (game: RawgGame, status: Status) => void;
  updateGame: (id: number, patch: Partial<GameEntry>) => void;
  removeGame: (id: number) => void;
  toggleFavorite: (id: number) => void;
  completeGame: (id: number, data: Partial<GameEntry>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  removeGoal: (id: string) => void;
  importData: (raw: string) => boolean;
};

const emptyUser = (name: string, avatar: string, bio: string): UserData => ({
  profile: {
    name,
    avatar,
    bio,
    favoriteGame: "—",
    favoritePlatform: "PlayStation 5",
    favoriteGenre: "Horror",
  },
  entries: [],
  activities: [],
  goals: [
    { id: "g1", title: "إنهاء 30 لعبة هذا العام", target: 30, current: 0, unit: "لعبة" },
    { id: "g2", title: "لعب 600 ساعة", target: 600, current: 0, unit: "ساعة" },
  ],
});

export const entryFromRawg = (g: RawgGame, status: Status): GameEntry => ({
  id: g.id,
  slug: g.slug,
  name: g.name,
  image: g.background_image,
  released: g.released,
  rating: g.rating ?? 0,
  metacritic: g.metacritic ?? null,
  platforms: (g.platforms ?? []).map((p) => p.platform.name),
  genres: (g.genres ?? []).map((x) => x.name),
  developer: g.developers?.[0]?.name ?? null,
  publisher: g.publishers?.[0]?.name ?? null,
  playtimeEstimate: g.playtime ?? 0,
  status,
  favorite: false,
  favoriteOrder: 0,
  progress: status === "completed" ? 100 : 0,
  hours: 0,
  personalRating: 0,
  review: "",
  notes: "",
  bestMoment: "",
  worstMoment: "",
  difficulty: "عادي",
  platform: (g.platforms ?? [])[0]?.platform.name ?? "",
  priority: "medium",
  price: 0,
  achievements: 0,
  replays: 0,
  fullCompletion: false,
  startedAt: status === "current" ? new Date().toISOString() : null,
  completedAt: status === "completed" ? new Date().toISOString() : null,
  addedAt: new Date().toISOString(),
});

const statusLabel: Record<Status, string> = {
  current: "قيد اللعب",
  completed: "المكتملة",
  backlog: "قائمة الانتظار",
  wishlist: "قائمة الرغبات",
};

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const mutate = (fn: (u: UserData) => UserData) =>
        set((s) => ({
          users: { ...s.users, [s.currentUser]: fn(s.users[s.currentUser]) },
        }));

      const log = (u: UserData, type: Activity["type"], text: string): UserData => ({
        ...u,
        activities: [
          { id: crypto.randomUUID(), type, text, at: new Date().toISOString() },
          ...u.activities,
        ].slice(0, 200),
      });

      return {
        currentUser: "faisal",
        users: {
          faisal: emptyUser("فيصل", "🎮", "لاعب رعب ومحب لسلسلة Resident Evil."),
          mishal: emptyUser("مشعل", "🕹️", "عاشق ألعاب القصة والعوالم المفتوحة."),
        },
        setUser: (u) => set({ currentUser: u }),
        addGame: (g, status) =>
          mutate((u) => {
            if (u.entries.some((e) => e.id === g.id)) {
              return {
                ...u,
                entries: u.entries.map((e) => (e.id === g.id ? { ...e, status } : e)),
              };
            }
            const next = { ...u, entries: [entryFromRawg(g, status), ...u.entries] };
            return log(
              next,
              status === "current" ? "start" : "add",
              `أُضيفت «${g.name}» إلى ${statusLabel[status]}`,
            );
          }),
        updateGame: (id, patch) =>
          mutate((u) => ({
            ...u,
            entries: u.entries.map((e) => (e.id === id ? { ...e, ...patch } : e)),
          })),
        removeGame: (id) => mutate((u) => ({ ...u, entries: u.entries.filter((e) => e.id !== id) })),
        toggleFavorite: (id) =>
          mutate((u) => {
            const entry = u.entries.find((e) => e.id === id);
            const next = {
              ...u,
              entries: u.entries.map((e) => (e.id === id ? { ...e, favorite: !e.favorite } : e)),
            };
            return entry && !entry.favorite
              ? log(next, "favorite", `أُضيفت «${entry.name}» إلى المفضلة`)
              : next;
          }),
        completeGame: (id, data) =>
          mutate((u) => {
            const entry = u.entries.find((e) => e.id === id);
            const next = {
              ...u,
              entries: u.entries.map((e) =>
                e.id === id
                  ? {
                      ...e,
                      ...data,
                      status: "completed" as Status,
                      progress: 100,
                      completedAt: new Date().toISOString(),
                    }
                  : e,
              ),
            };
            return entry ? log(next, "finish", `أُنهيت «${entry.name}» 🎉`) : next;
          }),
        updateProfile: (patch) => mutate((u) => ({ ...u, profile: { ...u.profile, ...patch } })),
        addGoal: (g) =>
          mutate((u) => ({ ...u, goals: [...u.goals, { ...g, id: crypto.randomUUID() }] })),
        removeGoal: (id) => mutate((u) => ({ ...u, goals: u.goals.filter((g) => g.id !== id) })),
        importData: (raw) => {
          try {
            const parsed = JSON.parse(raw) as { users: State["users"] };
            if (!parsed.users?.faisal || !parsed.users?.mishal) return false;
            set({ users: parsed.users });
            return true;
          } catch {
            return false;
          }
        },
      };
    },
    { name: "gamehub-store-v1" },
  ),
);

export const useCurrentData = () => useStore((s) => s.users[s.currentUser]);
