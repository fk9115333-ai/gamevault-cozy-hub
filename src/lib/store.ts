import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RawgGame } from "./rawg";

export type UserId = "faisal" | "mishal";
export type Status = "current" | "completed" | "backlog" | "wishlist" | "hype";
export type Priority = "high" | "medium" | "low";

export type GameEntry = {
  id: number;
  slug: string;
  name: string;
  image: string | null;
  released: string | null;
  rating: number;
  metacritic: number | null;
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
  priority: Priority;
  coop: boolean;
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
  priority: "medium",
  coop: false,
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
  hype: "المرتقبة",
};

export const otherUser = (u: UserId): UserId => (u === "faisal" ? "mishal" : "faisal");

export const useStore = create<State>()(
  persist(
    (set) => {
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

      // mirrors a co-op entry (hours + completion) into the other brother's library
      const syncCoop = (s: State, entry: GameEntry): State["users"] => {
        const other = otherUser(s.currentUser);
        const data = s.users[other];
        const exists = data.entries.some((e) => e.id === entry.id);
        const mirrored: GameEntry = {
          ...entry,
          favorite: exists ? (data.entries.find((e) => e.id === entry.id)?.favorite ?? false) : false,
        };
        return {
          ...s.users,
          [other]: {
            ...data,
            entries: exists
              ? data.entries.map((e) =>
                  e.id === entry.id
                    ? {
                        ...e,
                        hours: entry.hours,
                        coop: true,
                        status: entry.status,
                        progress: entry.progress,
                        fullCompletion: entry.fullCompletion,
                        completedAt: entry.completedAt,
                      }
                    : e,
                )
              : [mirrored, ...data.entries],
          },
        };
      };

      const applyEntry = (id: number, patch: Partial<GameEntry>, activity?: (e: GameEntry) => [Activity["type"], string]) =>
        set((s) => {
          const data = s.users[s.currentUser];
          const before = data.entries.find((e) => e.id === id);
          if (!before) return s;
          const after = { ...before, ...patch };
          let next: UserData = {
            ...data,
            entries: data.entries.map((e) => (e.id === id ? after : e)),
          };
          if (activity) {
            const [type, text] = activity(after);
            next = log(next, type, text);
          }
          const users = { ...s.users, [s.currentUser]: next };
          return after.coop ? { users: syncCoop({ ...s, users }, after) } : { users };
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
                entries: u.entries.map((e) =>
                  e.id === g.id
                    ? {
                        ...e,
                        status,
                        progress: status === "completed" ? 100 : e.progress,
                        completedAt:
                          status === "completed" ? (e.completedAt ?? new Date().toISOString()) : e.completedAt,
                      }
                    : e,
                ),
              };
            }
            const next = { ...u, entries: [entryFromRawg(g, status), ...u.entries] };
            return log(
              next,
              status === "current" ? "start" : status === "completed" ? "finish" : "add",
              `أُضيفت «${g.name}» إلى ${statusLabel[status]}`,
            );
          }),
        updateGame: (id, patch) => applyEntry(id, patch),
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
          applyEntry(
            id,
            {
              ...data,
              status: "completed",
              progress: 100,
              completedAt: new Date().toISOString(),
            },
            (e) => [
              "finish",
              `ختم «${e.name}» 🎉${e.personalRating ? ` وأعطاها تقييم ${e.personalRating}/10` : ""}`,
            ],
          ),
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
export const useOtherData = () => useStore((s) => s.users[otherUser(s.currentUser)]);
