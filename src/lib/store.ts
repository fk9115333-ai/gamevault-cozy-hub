import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RawgGame } from "./rawg";
import {
  deleteEntry as cloudDelete,
  pullAll,
  pushActivity,
  pushEntries,
  pushEntry,
  pushProfile,
  subscribeToCloud,
} from "./sync";

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
  /** ختمتها قديمًا — تُحتسب في الإجماليات لكن تُستثنى من الرسوم الزمنية */
  legacy: boolean;
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
  /** بداية رحلة التختيم — YYYY-MM */
  gamingStartDate: string | null;
};

type UserData = { profile: Profile; entries: GameEntry[]; activities: Activity[]; goals: Goal[] };

type State = {
  currentUser: UserId;
  hydrated: boolean;
  users: Record<UserId, UserData>;
  setUser: (u: UserId) => void;
  addGame: (game: RawgGame, status: Status) => void;
  updateGame: (id: number, patch: Partial<GameEntry>) => void;
  removeGame: (id: number) => void;
  toggleFavorite: (id: number) => void;
  completeGame: (id: number, data: Partial<GameEntry>) => void;
  updateProfile: (patch: Partial<Profile>) => void;
  setGamingStartDate: (v: string) => void;
  addGoal: (g: Omit<Goal, "id">) => void;
  removeGoal: (id: string) => void;
  importData: (raw: string) => boolean;
  hydrateFromCloud: () => Promise<void>;
};

const emptyUser = (name: string, avatar: string, bio: string): UserData => ({
  profile: { name, avatar, bio, favoriteGame: "—", favoriteGenre: "—", gamingStartDate: null },
  entries: [],
  activities: [],
  goals: [
    { id: "g1", title: "إنهاء 30 لعبة هذا العام", target: 30, current: 0, unit: "لعبة" },
    { id: "g2", title: "لعب 600 ساعة", target: 600, current: 0, unit: "ساعة" },
  ],
});

/** لعبة لم تصدر بعد ⇒ تُضاف دائمًا إلى «المرتقبة» */
export const isFutureRelease = (released: string | null | undefined) =>
  !!released && new Date(released).getTime() > Date.now();

export const resolveStatus = (released: string | null | undefined, wanted: Status): Status =>
  isFutureRelease(released) ? "hype" : wanted;

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
  legacy: false,
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
    (set, get) => {
      const log = (u: UserData, uid: UserId, type: Activity["type"], text: string): UserData => {
        const activity: Activity = { id: crypto.randomUUID(), type, text, at: new Date().toISOString() };
        pushActivity(uid, activity);
        return { ...u, activities: [activity, ...u.activities].slice(0, 200) };
      };

      const mutate = (fn: (u: UserData, uid: UserId) => UserData) =>
        set((s) => ({ users: { ...s.users, [s.currentUser]: fn(s.users[s.currentUser], s.currentUser) } }));

      // mirrors a co-op entry (hours + completion) into the other brother's library
      const syncCoop = (s: State, entry: GameEntry): State["users"] => {
        const other = otherUser(s.currentUser);
        const data = s.users[other];
        const existing = data.entries.find((e) => e.id === entry.id);
        const mirrored: GameEntry = { ...entry, favorite: existing?.favorite ?? false };
        const entries = existing
          ? data.entries.map((e) =>
              e.id === entry.id
                ? {
                    ...e,
                    hours: entry.hours,
                    coop: true,
                    status: entry.status,
                    progress: entry.progress,
                    fullCompletion: entry.fullCompletion,
                    legacy: entry.legacy,
                    completedAt: entry.completedAt,
                  }
                : e,
            )
          : [mirrored, ...data.entries];
        pushEntries(other, entries.filter((e) => e.id === entry.id));
        return { ...s.users, [other]: { ...data, entries } };
      };

      const applyEntry = (
        id: number,
        patch: Partial<GameEntry>,
        activity?: (e: GameEntry) => [Activity["type"], string],
      ) =>
        set((s) => {
          const uid = s.currentUser;
          const data = s.users[uid];
          const before = data.entries.find((e) => e.id === id);
          if (!before) return s;
          const after = { ...before, ...patch };
          let next: UserData = { ...data, entries: data.entries.map((e) => (e.id === id ? after : e)) };
          if (activity) {
            const [type, text] = activity(after);
            next = log(next, uid, type, text);
          }
          pushEntry(uid, after);
          const users = { ...s.users, [uid]: next };
          return after.coop ? { users: syncCoop({ ...s, users }, after) } : { users };
        });

      return {
        currentUser: "faisal",
        hydrated: false,
        users: {
          faisal: emptyUser("فيصل", "🎮", "لاعب رعب ومحب لسلسلة Resident Evil."),
          mishal: emptyUser("مشعل", "🕹️", "عاشق ألعاب القصة والعوالم المفتوحة."),
        },
        setUser: (u) => set({ currentUser: u }),
        addGame: (g, wanted) =>
          mutate((u, uid) => {
            const status = resolveStatus(g.released, wanted);
            const existing = u.entries.find((e) => e.id === g.id);
            if (existing) {
              const after: GameEntry = {
                ...existing,
                status,
                progress: status === "completed" ? 100 : existing.progress,
                completedAt:
                  status === "completed"
                    ? (existing.completedAt ?? new Date().toISOString())
                    : existing.completedAt,
              };
              pushEntry(uid, after);
              return { ...u, entries: u.entries.map((e) => (e.id === g.id ? after : e)) };
            }
            const entry = entryFromRawg(g, status);
            pushEntry(uid, entry);
            return log(
              { ...u, entries: [entry, ...u.entries] },
              uid,
              status === "current" ? "start" : status === "completed" ? "finish" : "add",
              `أُضيفت «${g.name}» إلى ${statusLabel[status]}`,
            );
          }),
        updateGame: (id, patch) => applyEntry(id, patch),
        removeGame: (id) =>
          mutate((u, uid) => {
            cloudDelete(uid, id);
            return { ...u, entries: u.entries.filter((e) => e.id !== id) };
          }),
        toggleFavorite: (id) =>
          mutate((u, uid) => {
            const entry = u.entries.find((e) => e.id === id);
            if (!entry) return u;
            const after = { ...entry, favorite: !entry.favorite };
            pushEntry(uid, after);
            const next = { ...u, entries: u.entries.map((e) => (e.id === id ? after : e)) };
            return after.favorite ? log(next, uid, "favorite", `أُضيفت «${entry.name}» إلى المفضلة`) : next;
          }),
        completeGame: (id, data) =>
          applyEntry(
            id,
            {
              ...data,
              status: "completed",
              progress: 100,
              completedAt: data.completedAt ?? new Date().toISOString(),
            },
            (e) => [
              "finish",
              `ختم «${e.name}» 🎉${e.personalRating ? ` وأعطاها تقييم ${e.personalRating}/10` : ""}`,
            ],
          ),
        updateProfile: (patch) =>
          mutate((u, uid) => {
            const profile = { ...u.profile, ...patch };
            pushProfile(uid, profile);
            return { ...u, profile };
          }),
        setGamingStartDate: (v) => get().updateProfile({ gamingStartDate: v }),
        addGoal: (g) => mutate((u) => ({ ...u, goals: [...u.goals, { ...g, id: crypto.randomUUID() }] })),
        removeGoal: (id) => mutate((u) => ({ ...u, goals: u.goals.filter((g) => g.id !== id) })),
        importData: (raw) => {
          try {
            const parsed = JSON.parse(raw) as { users: State["users"] };
            if (!parsed.users?.faisal || !parsed.users?.mishal) return false;
            set({ users: parsed.users });
            (["faisal", "mishal"] as UserId[]).forEach((u) => {
              pushEntries(u, parsed.users[u].entries);
              pushProfile(u, parsed.users[u].profile);
            });
            return true;
          } catch {
            return false;
          }
        },
        hydrateFromCloud: async () => {
          const snap = await pullAll();
          if (!snap) {
            set({ hydrated: true });
            return;
          }
          set((s) => ({
            hydrated: true,
            users: {
              faisal: {
                ...s.users.faisal,
                profile: { ...s.users.faisal.profile, ...snap.profiles.faisal },
                entries: snap.entries.faisal,
                activities: snap.activities.faisal,
              },
              mishal: {
                ...s.users.mishal,
                profile: { ...s.users.mishal.profile, ...snap.profiles.mishal },
                entries: snap.entries.mishal,
                activities: snap.activities.mishal,
              },
            },
          }));
        },
      };
    },
    {
      name: "gamehub-store-v2",
      partialize: (s) => ({ currentUser: s.currentUser, users: s.users }) as unknown as State,
    },
  ),
);

/** يشغّل السحب الأولي والاشتراك اللحظي (يُستدعى مرة واحدة من الجذر) */
export function startCloudSync() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const refresh = () => {
    clearTimeout(timer);
    timer = setTimeout(() => void useStore.getState().hydrateFromCloud(), 300);
  };
  void useStore.getState().hydrateFromCloud();
  const unsubscribe = subscribeToCloud(refresh);
  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}

export const useCurrentData = () => useStore((s) => s.users[s.currentUser]);
export const useOtherData = () => useStore((s) => s.users[otherUser(s.currentUser)]);
