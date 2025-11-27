# Reddit Lite (Vite + React + Supabase)

Opinionated Reddit-style app with subforums, posts, comments, auth-only access, edit/delete, and comment history logging. Frontend is static (Vite/React) and deploys to GitHub Pages; backend is Supabase (auth + PostgREST).

## Features
- Auth: email/password (Supabase) with RLS enforcing authenticated read/write.
- Subforums: create/list; posts are scoped to a subforum; threads hidden until a subforum is selected.
- Threads: create/edit/delete posts; search by title/body within selected subforum.
- Comments: create/edit/delete; updated flag and history logging in `comment_history`.
- History: all post/comment inserts/updates/deletes logged server-side (`posts_history`, `comment_history`).
- Hosting: GitHub Pages; build uses secrets for Supabase envs.

## Local dev
```bash
npm install
cp .env.example .env  # set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase setup
1) Create a Supabase project; grab anon key + project URL (paste into `.env`).
2) In SQL editor, run `supabase.sql` to create/alter tables:
   - `sub_forums`, `posts` (with `subforum_id`, `updated_at`), `comments` (with `updated_at`), history tables `posts_history`, `comment_history`.
   - RLS: auth-only select; insert/update/delete limited to owner; history tables readable and insertable by authenticated users (for triggers).
   - Triggers: `updated_at` on posts/comments; log all post/comment inserts/updates/deletes into history tables.
3) Test: sign up/sign in, create a subforum, post, and comment.

## Deploy (GitHub Pages via Actions)
1) Repo secrets (Settings → Secrets → Actions):
   - `VITE_SUPABASE_URL`: your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: your Supabase anon key
2) Ensure Pages uses GitHub Actions.
3) Push to `main`; workflow `.github/workflows/deploy.yml` builds with secrets and deploys to Pages.
4) To trigger manually: GitHub → Actions → Deploy to GitHub Pages → Run workflow.
5) Local deploy (optional): `npm run deploy` (requires `.env`).
6) If the deploy is blocked by environment protection, approve the `github-pages` environment in Actions or loosen the environment rules, then re-run the workflow.

## Environment
- `.env` is ignored; never commit keys.
- Prod build will throw if `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` are missing.
- Vite `base` is set to `/reddit-lite/` for Pages compatibility.

## Reusability / integration notes
- API surface is plain Supabase tables; adjust RLS for stricter/looser rules if embedding elsewhere.
- Subforum scoping: posts require `subforum_id`; UI hides threads until a subforum is selected.
- Comment history: available in `comment_history` for auditing/edit logs.
