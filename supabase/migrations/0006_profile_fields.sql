-- Migration 0006: Add profile customization fields to users.
-- Safe to run: columns use IF NOT EXISTS, unique index uses IF NOT EXISTS.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS website text;

-- Unique username index (idempotent).
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON public.users (username) WHERE username IS NOT NULL;
