-- =============================================================================
-- Post Drive — Supabase Schema
-- Apply this whole file to a fresh Supabase project to recreate the schema.
-- =============================================================================

-- 1. users --------------------------------------------------------------------
-- Synced from auth.users via trigger on_auth_user_created.
-- Custom app-level user data lives here.

create table users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text,
    created_at timestamptz default now()
);

create function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

alter table users enable row level security;
create policy "users_own_row" on users for all using (auth.uid() = id);


-- 2. threads_accounts ---------------------------------------------------------
-- Stores Threads accounts linked to app users via user_id.
-- Multiple accounts per user are supported.

create table threads_accounts (
    id uuid primary key default gen_random_uuid(),

    threads_user_id text,

    access_token text,

    created_at timestamptz default now(),

    token_expires_at timestamptz,

    user_id uuid references users(id)
);

create index idx_threads_accounts_user_id on threads_accounts(user_id);


-- 3. user_preferences ---------------------------------------------------------
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


-- 4. Row-Level Security -------------------------------------------------------

alter table threads_accounts enable row level security;
alter table user_preferences enable row level security;

create policy "users_own_accounts" on threads_accounts
  for all using (auth.uid() = user_id);

create policy "users_own_preferences" on user_preferences
  for all using (
    threads_account_id in (
      select id from threads_accounts where user_id = auth.uid()
    )
  );
