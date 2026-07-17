-- session_date was `date` (no time component), so two lives on the same day
-- (e.g. one in the morning, one at night) couldn't be told apart in the UI.
-- Nothing in the schema ever blocked multiple live_sessions rows sharing a
-- tiktok_account_id + day (no unique constraint) — this only adds the time.
alter table public.live_sessions
  alter column session_date type timestamptz using session_date::timestamptz;
