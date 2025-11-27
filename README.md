# Reddit Lite (Vite + React + Supabase)

Simple thread + comment app with a Supabase backend and static hosting on GitHub Pages.

## Quick start
```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
npm run dev
```

## Supabase setup (auth + data)
1) Create a Supabase project and grab the anon key + URL (paste into `.env`).
2) Run `supabase.sql` in the SQL editor to create tables (sub_forums, posts, comments), add user/subforum columns, enable RLS, and enforce authenticated read + insert policies (no anonymous reads).
3) Test locally (`npm run dev`), sign up/sign in with email/password, then create a subforum, post, and comment.

## Deploy to GitHub Pages
1) Set repo secrets in GitHub: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
2) Ensure Pages is configured to use GitHub Actions.
3) Push to `main`; the workflow `.github/workflows/deploy.yml` will build with secrets and deploy to Pages.
4) You can also trigger the workflow manually from GitHub → Actions → Deploy to GitHub Pages → Run workflow.
4) Local deploy (optional): `npm run deploy` (requires `.env` locally).

## Notes
- `.env` is ignored; keep your anon key out of git.
- Auth is required for all reads/writes (threads hidden when logged out).
