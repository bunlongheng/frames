# New App Checklist - Frames

11-phase checklist for onboarding any new app into the local dev ecosystem.
Any Claude session can reference this to know every house rule.

---

## Phase 1 - Scaffold

- [x] Next.js app created (`npx create-next-app`)
- [x] `package.json` scripts: `dev`, `build`, `start`, `lint`
- [ ] Add `typecheck` script: `"typecheck": "tsc --noEmit"`
- [ ] Add `test` script (or placeholder): `"test": "echo no tests yet"`
- [ ] Verify `npm run dev` starts cleanly

## Phase 2 - Git + GitHub

- [x] Git repo initialized
- [x] Remote: `https://github.com/bunlongheng/frames.git`
- [ ] Set repo description on GitHub: "Device mockup generator - frame screenshots in Apple devices"
- [ ] Add topics: `nextjs`, `device-mockup`, `screenshot`, `apple`, `sharp`
- [ ] Delete `.github/dependabot.yml` if it exists (each merged PR = 1 Vercel deploy)
- [ ] Close any open Dependabot PRs

## Phase 3 - Local Apps

- [ ] Register in local-apps dashboard (port + name + color)
- [ ] Assign port: `3006` (next available after ai-spinner:3005)
- [ ] Update `package.json` dev script: `"dev": "next dev -p 3006"`
- [ ] Add Caddy entry to `/opt/homebrew/etc/Caddyfile`:
  ```
  http://frames.localhost {
      reverse_proxy localhost:3006
      handle_errors 502 503 {
          root * /opt/homebrew/etc
          rewrite * /offline.html
          file_server
      }
  }
  ```
- [ ] Reload Caddy: `brew services restart caddy`
- [ ] Add favicon (already exists)
- [ ] Take initial screenshot for local-apps gallery

## Phase 4 - Vercel

- [x] Vercel project linked (`.vercel/project.json` exists)
- [ ] First deploy: `git push origin main`
- [ ] Set homepage URL in GitHub repo settings
- [ ] Add `vercel.json` with ignoreCommand:
  ```json
  {
    "ignoreCommand": "git log -1 --pretty=%B | grep -qE '^(chore|ci|test|docs):' && exit 0 || exit 1"
  }
  ```
- [ ] Verify `chore:` commits skip deploy

## Phase 5 - Shell Alias

- [ ] Add to `~/.claude-tabs.sh`:
  ```bash
  _frames()       { _tab "frames"             "FRAMES"         255  140  200; }
  ```
- [ ] Source: `source ~/.claude-tabs.sh`
- [ ] Test: run `_frames` in iTerm2

## Phase 6 - Security

- [ ] Add security headers in `next.config.ts`:
  ```ts
  headers: async () => [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }]
  ```
- [ ] Run `npm audit` - zero vulnerabilities
- [ ] Create `.env.example` (even if empty, documents that no env vars are needed)
- [ ] Verify `.env*` is in `.gitignore`

## Phase 7 - Auth

- [ ] Not applicable (public tool, no auth needed)
- [ ] If API abuse becomes a concern, add rate limiting to `/api/frame`

## Phase 8 - Performance

- [ ] Use `next/image` where applicable (device picker icons)
- [ ] Verify `sharp` is production-ready (already installed for API)
- [ ] Run Lighthouse - target 99+ desktop, 90+ mobile
- [ ] Verify API response times < 3s for typical screenshots

## Phase 9 - Pre-push Hook

- [ ] Install Husky: `npm install -D husky && npx husky init`
- [ ] Set pre-push to typecheck only (not full build):
  ```bash
  # .husky/pre-push
  npm run typecheck
  ```
- [ ] Verify hook fires on `git push`

## Phase 10 - Commits

- [ ] Use prefix conventions: `feat:`, `fix:`, `perf:`, `refactor:`, `chore:`, `ci:`, `test:`, `docs:`
- [ ] Never force push to main
- [ ] `chore:`/`ci:`/`test:`/`docs:` skip Vercel deploy (via ignoreCommand)

## Phase 11 - Verify

- [ ] `http://frames.localhost` loads via Caddy
- [ ] `http://localhost:3006` loads directly
- [ ] Vercel production URL works
- [ ] API endpoint works: `curl -X POST -F "image=@test.png" https://frames.vercel.app/api/frame -o out.png`
- [ ] `npm run typecheck` passes
- [ ] `npm audit` clean
- [ ] Screenshot added to local-apps gallery
- [ ] iTerm2 tab alias works (`_frames`)
