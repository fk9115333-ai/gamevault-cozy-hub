CREATE TABLE public.profiles (
  user_id text PRIMARY KEY CHECK (user_id IN ('faisal','mishal')),
  name text NOT NULL DEFAULT '',
  avatar text NOT NULL DEFAULT '🎮',
  bio text NOT NULL DEFAULT '',
  favorite_game text NOT NULL DEFAULT '—',
  favorite_genre text NOT NULL DEFAULT '—',
  gaming_start_date text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.game_entries (
  user_id text NOT NULL CHECK (user_id IN ('faisal','mishal')),
  game_id bigint NOT NULL,
  slug text NOT NULL DEFAULT '',
  name text NOT NULL DEFAULT '',
  image text,
  released text,
  rating numeric NOT NULL DEFAULT 0,
  metacritic integer,
  genres text[] NOT NULL DEFAULT '{}',
  developer text,
  publisher text,
  playtime_estimate integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'backlog',
  favorite boolean NOT NULL DEFAULT false,
  favorite_order integer NOT NULL DEFAULT 0,
  progress integer NOT NULL DEFAULT 0,
  hours numeric NOT NULL DEFAULT 0,
  personal_rating numeric NOT NULL DEFAULT 0,
  review text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  best_moment text NOT NULL DEFAULT '',
  worst_moment text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  coop boolean NOT NULL DEFAULT false,
  full_completion boolean NOT NULL DEFAULT false,
  legacy boolean NOT NULL DEFAULT false,
  started_at text,
  completed_at text,
  added_at text NOT NULL DEFAULT to_char(now(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, game_id)
);

CREATE TABLE public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL CHECK (user_id IN ('faisal','mishal')),
  type text NOT NULL,
  text text NOT NULL,
  at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX activities_user_at_idx ON public.activities (user_id, at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_entries TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activities TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.game_entries TO service_role;
GRANT ALL ON public.activities TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "open access profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open access game_entries" ON public.game_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "open access activities" ON public.activities FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER TABLE public.game_entries REPLICA IDENTITY FULL;
ALTER TABLE public.activities REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_entries;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;

INSERT INTO public.profiles (user_id, name, avatar, bio, favorite_genre) VALUES
  ('faisal', 'فيصل', '🎮', 'لاعب رعب ومحب لسلسلة Resident Evil.', 'Horror'),
  ('mishal', 'مشعل', '🕹️', 'عاشق ألعاب القصة والعوالم المفتوحة.', 'Adventure');