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
2) Run `supabase.sql` in the SQL editor to create tables (posts/comments), add user columns, enable RLS, and add authenticated insert policies.
3) Enable OAuth providers you want (Auth → Providers → Google/Apple) and configure redirect URLs:
   - Local dev: `http://localhost:5173/`
   - GitHub Pages: `https://svrohith9.github.io/reddit-lite/`
4) Test locally (`npm run dev`) and create a post/comment after signing in.

## Deploy to GitHub Pages
```bash
# set homepage to your user
node -e "const fs=require('fs');const p=require('./package.json');p.homepage='https://YOUR_GH_USER.github.io/reddit-lite';fs.writeFileSync('package.json',JSON.stringify(p,null,2));"
git add package.json && git commit -m "chore: set homepage"

git remote add origin https://github.com/YOUR_GH_USER/reddit-lite.git
git push -u origin main
npm run deploy  # pushes dist to gh-pages
```

## Notes
- `.env` is ignored; keep your anon key out of git.
- If you prefer stricter access, replace the permissive RLS policies with auth-aware checks.
