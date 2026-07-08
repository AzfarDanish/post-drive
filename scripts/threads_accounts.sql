create table threads_accounts (
    id uuid primary key default gen_random_uuid(),

    threads_user_id text,

    access_token text,

    created_at timestamptz default now()
);
