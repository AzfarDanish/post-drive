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
