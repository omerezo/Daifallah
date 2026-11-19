# Deploy brief: Daifallah (Dhaifallah Sons Charity Management System)

Owner: Omer. Repo: https://github.com/omerezo/Daifallah (branch `main`).
Goal: run this app in production on the owner's server and keep it running after reboots.

## What the app is
- Next.js 14 (App Router) + Tailwind + ShadCN UI. Arabic/English.
- Backend is Firebase (Auth + Firestore), called from the browser.
  Config is in `src/firebase/config.ts` (project `studio-2973263034-5130d`).
  These are public Firebase web keys, not secrets. No server-side env vars are required.
- No AI features are active (`src/ai/genkit.ts` is a stub).
- `next.config.js` is the real config; `next.config.ts` is intentionally blank.

## Steps
1. Install Node.js 20 LTS (or 22) and git on the server.
2. Clone: `git clone https://github.com/omerezo/Daifallah.git` (outside OneDrive).
3. `npm ci`
4. Security: update Next to the latest patched 14.2.x release
   (`npm install next@14`), run the build, and tell the owner the version you ended on.
5. Build: `npm run build`.
   NOTE: the build script is `NODE_ENV=production next build` (Unix syntax). On Windows
   it fails. Change it to `"build": "next build"` (next build already uses production mode)
   and report the change.
   `ignoreBuildErrors` / `ignoreDuringBuilds` are on in next.config.js: also run
   `npm run typecheck` and report the error count (do not block the deploy on it).
6. Run: `npm start -- -p 3000` (pick a free port; report it).
7. Keep it running as a service:
   - Windows: NSSM service named `daifallah` running `npm start` in the repo folder,
     auto-start, restart on failure, logs to `logs\`.
   - Linux: pm2 or a systemd unit.
   Make sure the server does not sleep.
8. Public access (ask the owner which domain to use before doing this):
   reverse proxy (Caddy/Nginx/IIS) or a Cloudflare Tunnel with HTTPS.
9. Firebase Auth: the owner must add the new domain (and the server IP if used) in
   Firebase Console > Authentication > Settings > Authorized domains, or login will fail.
   Tell the owner exactly which domain to add.
10. Clean-up (optional, report only): `allowedDevOrigins` in next.config.js points at the old
   Firebase Studio workstation and can be removed.

## Do not
- Do not change Firestore data or `firestore.rules` without asking the owner.
- Do not commit secrets or `.env*.local` files.
- `git pull --no-edit` before every push.

## Report back (write to handoff/from-agent.md)
- Node and Next versions, port, service name, public URL.
- Output of `npm run build` (last lines) and the typecheck error count.
- A test: open the URL, log in with an owner account, open Dashboard and Payments.
- Any file you changed and why.
