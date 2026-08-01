ALTER TABLE public.game_entries
  ADD COLUMN IF NOT EXISTS queue_position integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS recommend boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replay boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hall_of_fame boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sessions jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.game_entries SET status = 'backlog' WHERE status = 'wishlist';