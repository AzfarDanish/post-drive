# Post Drive

AI-powered content creation for [Threads](https://www.threads.net). Describe your business, pick a tone, and let AI generate threaded posts that sound like a real person — not a brand. Edit, add media, and publish directly to Threads via the Meta Graph API.

## Features

- **AI thread generation** — Uses OpenAI GPT-4o-mini to generate 2–4 post threads in your choice of tone (Rage Bait, Hot Take, Storytelling, Educational)
- **Character limit control** — Adjustable min/max per post (30–500 characters)
- **Business context** — Add your website, target audience, key features, and main problem so the AI writes on-brand content
- **Open Graph previews** — Paste a URL and see an automatic link preview
- **Media uploads** — Attach images or video to any post in the thread
- **One-click publishing** — Publish the full thread to Threads via the Meta Graph API
- **Persistent preferences** — Your tone, character limits, and business context are saved per account

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | OpenAI GPT-4o-mini via Vercel AI SDK |
| Database | Supabase (Postgres) |
| Auth | Threads (Meta) OAuth |
| Package Manager | pnpm |

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
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

THREADS_APP_ID=your-threads-app-id
THREADS_APP_SECRET=your-threads-app-secret
THREADS_REDIRECT_URI=https://your-ngrok-domain.ngrok-free.dev/api/auth/threads/callback

NEXT_PUBLIC_THREADS_APP_ID=your-threads-app-id
NEXT_PUBLIC_THREADS_REDIRECT_URI=https://your-ngrok-domain.ngrok-free.dev/api/auth/threads/callback

OPENAI_API_KEY=sk-...
```

### Database Setup

Run the migration files in `scripts/` to create the required Supabase tables (`threads_accounts` and `user_preferences`).

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
