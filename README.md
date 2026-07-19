# Post Drive

> AI-powered content creation for [Threads](https://www.threads.net). Describe your business, pick a tone, and let AI generate posts that sound like a real person — not a brand. Edit, add media, and publish directly to Threads via the Meta Graph API.

## Overview

Post Drive is a web app for businesses and creators who want a consistent, authentic presence on Threads without spending hours writing. You provide business context (description, audience, problem, features), choose a tone, and the AI generates on-brand posts. You can edit the output, attach images or video, preview Open Graph link cards, and publish the full thread in one click. Everything is persistent per connected Threads account.

## Features

- **AI thread generation** — Uses OpenAI GPT-4o-mini to generate single posts in your choice of tone
- **4 tones** — Rage Bait (opinionated hook), Hot Take (contrarian angle), Storytelling (relatable anecdote), Educational (useful insight)
- **Content diversification** — The AI picks from 7 distinct content angles per generation (pain point, feature benefit, common mistake, before/after, myth busting, quick tip, personal observation) and avoids repeating angles used in recent posts
- **Character limit control** — Adjustable min/max per post (30–500 characters)
- **Business context** — Add your website, target audience, key features, and main problem so the AI writes on-brand content with relevant calls-to-action
- **Open Graph previews** — Paste a URL in the composer and see an automatic link preview card
- **Media uploads** — Attach images or video to any post
- **One-click publishing** — Publish directly to Threads via the Meta Graph API
- **Multi-account support** — Connect and switch between multiple Threads accounts
- **Persistent preferences** — Tone, character limits, and business context are saved per account (stored in Supabase)

## Architecture

### Page Flow

```
Landing (/) → Login/Signup → Connect Threads (/connect) → Compose & Publish (/post)
                              ↑                                    |
                              └────── Reconnect another account ────┘
```

### Key Directories

| Path | Purpose |
|---|---|
| `app/` | Next.js App Router — pages (route groups) and API handlers |
| `app/api/` | Serverless API routes for auth, AI generation, Threads API, media, preferences |
| `components/` | Client React components (auth provider, AI generator panel, nav status) |
| `hooks/` | SWR-based data fetching hooks (`use-preferences`, `use-accounts`) |
| `lib/` | Server-side utilities (Supabase client, AI generation, OG scraper, Threads publisher) |
| `scripts/` | Database migrations and test scripts |

### Data Flow

1. User authenticates via Supabase Auth (email/password)
2. User authorizes a Threads account via Meta OAuth — access token is stored in `threads_accounts`
3. On the `/post` page, the AI Generator panel reads/writes `user_preferences` for the selected account
4. Generate creates a post via OpenAI → displayed in the composer for editing
5. Publishing calls the Meta Graph API to create a media container, then publishes it

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | OpenAI GPT-4o-mini via [Vercel AI SDK](https://sdk.vercel.ai) |
| Database | [Supabase](https://supabase.com) (Postgres) |
| Auth | Supabase Auth (email/password) + Threads (Meta) OAuth |
| Client Data Fetching | [SWR](https://swr.vercel.app) |
| Package Manager | pnpm |
| Deployment | Vercel / Node.js hosting |

## Directory Structure

```
post-drive/
├── app/
│   ├── api/
│   │   ├── ai/generate/       # POST — generate a post via OpenAI
│   │   ├── auth/              # Supabase auth (login, signup, logout, session, callback)
│   │   │   └── threads/       # Threads OAuth initiation
│   │   ├── media/proxy/       # GET — proxy OG images
│   │   ├── og/                # GET — scrape Open Graph data from a URL
│   │   ├── preferences/       # GET/PUT — user preferences per account
│   │   ├── threads/           # Threads API proxies (check, post, publish, delete, uninstall)
│   │   └── upload/            # POST — upload image/video
│   ├── connect/               # Connect Threads accounts page
│   ├── login/                 # Login page
│   ├── post/                  # Main composer page
│   ├── signup/                # Signup page
│   ├── layout.tsx             # Root layout with nav
│   └── page.tsx               # Landing page
├── components/
│   ├── ai-generator-panel.tsx # AI generation form (tone, sliders, business context)
│   ├── auth-provider.tsx      # Auth context provider
│   └── nav-account-status.tsx # Nav bar auth status indicator
├── hooks/
│   ├── use-accounts.ts        # SWR hook for Threads accounts
│   └── use-preferences.ts     # SWR hook for user preferences
├── lib/
│   ├── ai.ts                  # OpenAI prompt templates, post generation & splitting
│   ├── fetcher.ts             # SWR fetcher utility
│   ├── generate.ts            # Post generation pipeline (generation + length fixing)
│   ├── og.ts                  # Open Graph metadata scraper
│   ├── publish.ts             # Threads API publishing logic
│   ├── supabase.ts            # Supabase admin client singleton
│   └── supabase/              # Supabase server & middleware clients
├── scripts/
│   ├── schema.sql             # Full database schema (run against Supabase)
│   ├── threads_accounts.sql   # threads_accounts table migration
│   ├── user_preferences.sql   # user_preferences table migration
│   ├── test-generate.ts       # AI generation test script
│   └── test-publish.ts        # Threads publishing test script
└── public/                    # Static assets
```

## Database Schema

Three tables in the `public` schema:

### `users`
Synced from `auth.users` via a trigger. Stores app-level user data.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | References `auth.users(id)` |
| `email` | `text` | |
| `created_at` | `timestamptz` | |

### `threads_accounts`
Threads accounts linked to app users. Supports multiple accounts per user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | Auto-generated |
| `user_id` | `uuid` FK → `users(id)` | |
| `threads_user_id` | `text` | Threads platform user ID |
| `access_token` | `text` | Meta OAuth access token |
| `token_expires_at` | `timestamptz` | Token expiry |
| `created_at` | `timestamptz` | |

### `user_preferences`
AI generation defaults. One row per Threads account.

| Column | Type | Default |
|---|---|---|
| `id` | `uuid` PK | Auto-generated |
| `threads_account_id` | `uuid` FK → `threads_accounts(id)` | |
| `default_tone` | `text` | `'rage-bait'` |
| `business_description` | `text` | `''` |
| `website_url` | `text` | `''` |
| `char_min` | `integer` | `240` |
| `char_max` | `integer` | `480` |
| `target_audience` | `text` | `''` |
| `main_problem` | `text` | `''` |
| `key_features` | `text` | `''` |

All tables have Row-Level Security (RLS) enabled with policies scoped to `auth.uid()`.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io/installation)
- A [Supabase](https://supabase.com) project
- A [Meta App](https://developers.facebook.com) with Threads API enabled
- An [OpenAI API key](https://platform.openai.com/api-keys)
- [ngrok](https://ngrok.com) (for local development with Threads OAuth)

## Environment Variables

Copy the following into `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Threads / Meta OAuth
THREADS_APP_ID=your-threads-app-id
THREADS_APP_SECRET=your-threads-app-secret
THREADS_REDIRECT_URI=https://your-ngrok-domain.ngrok-free.dev/api/auth/threads/callback

NEXT_PUBLIC_THREADS_APP_ID=your-threads-app-id
NEXT_PUBLIC_THREADS_REDIRECT_URI=https://your-ngrok-domain.ngrok-free.dev/api/auth/threads/callback

# OpenAI
OPENAI_API_KEY=sk-...
```

### Database Setup

Run the migration files in `scripts/` against your Supabase project to create the required tables:

```bash
# Apply schema.sql in the Supabase SQL editor, or run:
psql "$SUPABASE_DATABASE_URL" -f scripts/schema.sql
```

## Development

### 1. Start the dev server

```bash
pnpm dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### 2. Start ngrok

Threads OAuth requires a public HTTPS callback URL. Start ngrok pointing at your local server:

```bash
ngrok http 3000
```

Copy the generated `https://<your-subdomain>.ngrok-free.dev` URL.

### 3. Update environment

Set `THREADS_REDIRECT_URI` and `NEXT_PUBLIC_THREADS_REDIRECT_URI` in `.env.local` to your ngrok URL (e.g., `https://your-subdomain.ngrok-free.dev/api/auth/threads/callback`). Also add the ngrok origin to `allowedDevOrigins` in `next.config.ts`.

### 4. Configure Meta App

In the Meta App Dashboard, set the **OAuth redirect URI** to `https://your-subdomain.ngrok-free.dev/api/auth/threads/callback`.

### 5. Open the app

Visit your ngrok URL in a browser. Navigate to `/connect` to authenticate with Threads, then `/post` to start creating.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm lint` | Run ESLint |

## Deployment

Deploy to any Node.js hosting platform (Vercel, Railway, etc.). Set all environment variables in production and update the Threads OAuth redirect URI to your production domain.

For Vercel, the `vercel.json` at the project root contains the default configuration.
