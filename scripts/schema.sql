-- =============================================================================
-- Post Drive — Supabase Schema
-- Auto-posting Threads app.
-- Apply this whole file to a fresh Supabase project to recreate the schema.
-- =============================================================================

-- 1. threads_accounts ---------------------------------------------------------
-- Stores one connected Threads account (single-user for now).
-- Only the latest row (by created_at) is used.

create table threads_accounts (
    id uuid primary key default gen_random_uuid(),

    threads_user_id text,

    access_token text,

    created_at timestamptz default now(),

    -- Added by migration 2026-07-10: auto-post / token management
    token_expires_at timestamptz,           -- when the long-lived token expires; refresh cron uses this
    is_enabled boolean not null default false, -- kill switch: false = shadow mode (log only), true = publishes
    post_hour_utc int not null default 14,     -- hour of day (UTC) that auto-post cron fires
    last_posted_at timestamptz                 -- timestamp of last successful auto-publish
);


-- 2. user_preferences ---------------------------------------------------------
-- AI generation settings saved from the /post form.
-- One row per threads_account.

create table user_preferences (
    id uuid primary key default gen_random_uuid(),

    threads_account_id uuid not null references threads_accounts(id) on delete cascade,

    default_tone text not null default 'rage-bait',

    business_description text not null default '',

    website_url text not null default '',

    char_min integer not null default 240,

    char_max integer not null default 480,

    target_audience text not null default '',

    main_problem text not null default '',

    key_features text not null default '',

    updated_at timestamptz default now()
);

create unique index idx_user_preferences_account on user_preferences(threads_account_id);


-- 3. post_log -----------------------------------------------------------------
-- Every auto-post cron run logs here, whether it published or not.
-- Used for shadow-mode review and debugging.

create table post_log (
    id uuid primary key default gen_random_uuid(),
    posts jsonb not null,               -- array of post strings that were generated
    was_published boolean not null default false, -- true only if publishToThreads succeeded
    error text,                         -- error message if publishing failed
    created_at timestamptz not null default now()
);


-- 4. Row-Level Security -------------------------------------------------------
-- All tables are backend-only (accessed via SUPABASE_SERVICE_ROLE_KEY which
-- bypasses RLS). These policies block any direct client-side access.
-- Enable only when you want to lock down against the anon key.

-- ALTER TABLE threads_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_log ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "block_anon_access" ON threads_accounts FOR ALL USING (false);
-- CREATE POLICY "block_anon_access" ON user_preferences FOR ALL USING (false);
-- CREATE POLICY "block_anon_access" ON post_log FOR ALL USING (false);


-- 5. Useful queries -----------------------------------------------------------

-- Check auto-post status:
-- SELECT id, threads_user_id, is_enabled, token_expires_at, last_posted_at FROM threads_accounts;

-- Review recent auto-post logs:
-- SELECT * FROM post_log ORDER BY created_at DESC LIMIT 20;

-- Enable auto-publishing (flip kill switch):
-- UPDATE threads_accounts SET is_enabled = true;

-- Disable auto-publishing:
-- UPDATE threads_accounts SET is_enabled = false;

-- Set initial token expiry (run once after fresh OAuth connect):
-- UPDATE threads_accounts SET token_expires_at = now() + interval '60 days' WHERE token_expires_at IS NULL;
