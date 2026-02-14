# Frontend (Next.js) — deployable to Vercel

This is a minimal Next.js frontend scaffold. To run locally:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run start
```

To deploy to Vercel:

- Push this repo to GitHub (or connect your Git provider).
- Import the project in the Vercel dashboard and deploy (recommended).
- Or install the Vercel CLI and run `vercel`.

Files added:

- `package.json` — scripts + deps
- `pages/index.js` — basic landing page
- `pages/_app.js` — global styles import
- `styles/globals.css` — small CSS
