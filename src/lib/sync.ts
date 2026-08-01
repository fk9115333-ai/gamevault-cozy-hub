import { supabase } from "@/integrations/supabase/client";
import type { Activity, GameEntry, Profile, UserId } from "./store";

/* ---------- mappers ---------- */

export const entryToRow = (userId: UserId, e: GameEntry) => ({
  user_id: userId,
  game_id: e.id,
  slug: e.slug,
  name: e.name,
  image: e.image,
  released: e.released,
  rating: e.rating,
  metacritic: e.metacritic,
  genres: e.genres,
  developer: e.developer,
  publisher: e.publisher,
  playtime_estimate: e.playtimeEstimate,
  status: e.status,
  favorite: e.favorite,
  favorite_order: e.favoriteOrder,
  queue_position: e.queuePosition,
  progress: e.progress,
  hours: e.hours,
  personal_rating: e.personalRating,
  recommend: e.recommend,
  replay: e.replay,
  hall_of_fame: e.hallOfFame,
  sessions: e.sessions,
  review: e.review,
  notes: e.notes,
  best_moment: e.bestMoment,
  worst_moment: e.worstMoment,
  priority: e.priority,
  coop: e.coop,
  full_completion: e.fullCompletion,
  started_at: e.startedAt,
  completed_at: e.completedAt,
  added_at: e.addedAt,
  updated_at: new Date().toISOString(),
});

type Row = Record<string, unknown>;

export const rowToEntry = (r: Row): GameEntry => ({
  id: Number(r["game_id"]),
  slug: String(r["slug"] ?? ""),
  name: String(r["name"] ?? ""),
  image: (r["image"] as string | null) ?? null,
  released: (r["released"] as string | null) ?? null,
  rating: Number(r["rating"] ?? 0),
  metacritic: (r["metacritic"] as number | null) ?? null,
  genres: (r["genres"] as string[] | null) ?? [],
  developer: (r["developer"] as string | null) ?? null,
  publisher: (r["publisher"] as string | null) ?? null,
  playtimeEstimate: Number(r["playtime_estimate"] ?? 0),
  status: ((r["status"] as string) === "wishlist"
    ? "backlog"
    : ((r["status"] as GameEntry["status"]) ?? "backlog")) as GameEntry["status"],
  favorite: Boolean(r["favorite"]),
  favoriteOrder: Number(r["favorite_order"] ?? 0),
  queuePosition: Number(r["queue_position"] ?? 0),
  progress: Number(r["progress"] ?? 0),
  hours: Number(r["hours"] ?? 0),
  personalRating: Number(r["personal_rating"] ?? 0),
  recommend: Boolean(r["recommend"]),
  replay: Boolean(r["replay"]),
  hallOfFame: Boolean(r["hall_of_fame"]),
  sessions: (r["sessions"] as GameEntry["sessions"] | null) ?? [],
  review: String(r["review"] ?? ""),
  notes: String(r["notes"] ?? ""),
  bestMoment: String(r["best_moment"] ?? ""),
  worstMoment: String(r["worst_moment"] ?? ""),
  priority: (r["priority"] as GameEntry["priority"]) ?? "medium",
  coop: Boolean(r["coop"]),
  fullCompletion: Boolean(r["full_completion"]),
  startedAt: (r["started_at"] as string | null) ?? null,
  completedAt: (r["completed_at"] as string | null) ?? null,
  addedAt: String(r["added_at"] ?? new Date().toISOString()),
});


/* ---------- pushes (fire and forget) ---------- */

const warn = (label: string) => (res: { error: unknown } | null) => {
  if (res?.error) console.warn(`[sync] ${label}`, res.error);
};

export const pushEntry = (userId: UserId, entry: GameEntry) => {
  void supabase
    .from("game_entries")
    .upsert(entryToRow(userId, entry), { onConflict: "user_id,game_id" })
    .then(warn("upsert entry"));
};

export const pushEntries = (userId: UserId, entries: GameEntry[]) => {
  if (!entries.length) return;
  void supabase
    .from("game_entries")
    .upsert(
      entries.map((e) => entryToRow(userId, e)),
      { onConflict: "user_id,game_id" },
    )
    .then(warn("upsert entries"));
};

export const deleteEntry = (userId: UserId, gameId: number) => {
  void supabase
    .from("game_entries")
    .delete()
    .eq("user_id", userId)
    .eq("game_id", gameId)
    .then(warn("delete entry"));
};

export const pushActivity = (userId: UserId, a: Activity) => {
  void supabase
    .from("activities")
    .insert({ id: a.id, user_id: userId, type: a.type, text: a.text, at: a.at })
    .then(warn("insert activity"));
};

export const pushProfile = (userId: UserId, p: Profile) => {
  void supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        name: p.name,
        avatar: p.avatar,
        bio: p.bio,
        favorite_game: p.favoriteGame,
        favorite_genre: p.favoriteGenre,
        updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    .then(warn("upsert profile"));
};

/* ---------- pull ---------- */

export type CloudSnapshot = {
  profiles: Record<UserId, Partial<Profile>>;
  entries: Record<UserId, GameEntry[]>;
  activities: Record<UserId, Activity[]>;
};

export async function pullAll(): Promise<CloudSnapshot | null> {
  const [p, g, a] = await Promise.all([
    supabase.from("profiles").select("*"),
    supabase.from("game_entries").select("*"),
    supabase.from("activities").select("*").order("at", { ascending: false }).limit(400),
  ]);
  if (p.error || g.error || a.error) {
    console.warn("[sync] pull failed", p.error ?? g.error ?? a.error);
    return null;
  }

  const snap: CloudSnapshot = {
    profiles: { faisal: {}, mishal: {} },
    entries: { faisal: [], mishal: [] },
    activities: { faisal: [], mishal: [] },
  };

  (p.data ?? []).forEach((r: Row) => {
    const u = r["user_id"] as UserId;
    if (!snap.profiles[u]) return;
    snap.profiles[u] = {
      name: String(r["name"] ?? ""),
      avatar: String(r["avatar"] ?? "🎮"),
      bio: String(r["bio"] ?? ""),
      favoriteGame: String(r["favorite_game"] ?? "—"),
      favoriteGenre: String(r["favorite_genre"] ?? "—"),
      gamingStartDate: (r["gaming_start_date"] as string | null) ?? null,
    };
  });

  (g.data ?? []).forEach((r: Row) => {
    const u = r["user_id"] as UserId;
    snap.entries[u]?.push(rowToEntry(r));
  });
  (["faisal", "mishal"] as UserId[]).forEach((u) =>
    snap.entries[u].sort((x, y) => y.addedAt.localeCompare(x.addedAt)),
  );

  (a.data ?? []).forEach((r: Row) => {
    const u = r["user_id"] as UserId;
    snap.activities[u]?.push({
      id: String(r["id"]),
      type: r["type"] as Activity["type"],
      text: String(r["text"] ?? ""),
      at: String(r["at"]),
    });
  });

  return snap;
}

export function subscribeToCloud(onChange: () => void) {
  const channel = supabase
    .channel("gamehub-sync")
    .on("postgres_changes", { event: "*", schema: "public", table: "game_entries" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "activities" }, onChange)
    .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, onChange)
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}
