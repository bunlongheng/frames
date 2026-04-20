#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# onboard-app.sh - Automated onboarding for Frames into the local dev ecosystem
# Runs the 10 automatable steps from NEW_APP_CHECKLIST.md
# ─────────────────────────────────────────────────────────────────────────────

APP_NAME="frames"
APP_LABEL="FRAMES"
APP_PORT=3006
APP_COLOR_R=255
APP_COLOR_G=140
APP_COLOR_B=200
APP_DIR="$HOME/Sites/$APP_NAME"
CADDYFILE="/opt/homebrew/etc/Caddyfile"
TABS_FILE="$HOME/.claude-tabs.sh"

green()  { printf '\033[32m%s\033[0m\n' "$1"; }
yellow() { printf '\033[33m%s\033[0m\n' "$1"; }
red()    { printf '\033[31m%s\033[0m\n' "$1"; }
step()   { printf '\n\033[36m[Step %s/10]\033[0m %s\n' "$1" "$2"; }

cd "$APP_DIR" || { red "Directory $APP_DIR not found"; exit 1; }

# ── Step 1: Add missing package.json scripts ────────────────────────────────
step 1 "Add typecheck + test scripts to package.json"

if ! grep -q '"typecheck"' package.json; then
    # Insert typecheck after lint
    sed -i '' '/"lint"/a\
    "typecheck": "tsc --noEmit",
' package.json
    green "Added typecheck script"
else
    yellow "typecheck script already exists"
fi

if ! grep -q '"test"' package.json; then
    sed -i '' '/"lint"/a\
    "test": "echo \\"no tests yet\\"",
' package.json
    green "Added test script"
else
    yellow "test script already exists"
fi

# ── Step 2: Set dev port ─────────────────────────────────────────────────────
step 2 "Set dev server port to $APP_PORT"

if grep -q "\"dev\": \"next dev\"" package.json; then
    sed -i '' "s/\"dev\": \"next dev\"/\"dev\": \"next dev -p $APP_PORT\"/" package.json
    green "Dev port set to $APP_PORT"
elif grep -q "next dev -p $APP_PORT" package.json; then
    yellow "Port already set to $APP_PORT"
else
    yellow "Dev script has custom config, skipping"
fi

# ── Step 3: Kill Dependabot ──────────────────────────────────────────────────
step 3 "Remove Dependabot config"

if [ -f .github/dependabot.yml ]; then
    rm .github/dependabot.yml
    green "Deleted .github/dependabot.yml"
else
    yellow "No dependabot.yml found (good)"
fi

# ── Step 4: Add Caddy reverse proxy entry ────────────────────────────────────
step 4 "Add Caddy entry for http://$APP_NAME.localhost"

if grep -q "$APP_NAME.localhost" "$CADDYFILE" 2>/dev/null; then
    yellow "Caddy entry already exists"
else
    cat >> "$CADDYFILE" <<EOF

http://$APP_NAME.localhost {
	reverse_proxy localhost:$APP_PORT
	handle_errors 502 503 {
		root * /opt/homebrew/etc
		rewrite * /offline.html
		file_server
	}
}
EOF
    green "Added Caddy entry"
    brew services restart caddy 2>/dev/null && green "Caddy restarted" || yellow "Restart Caddy manually: brew services restart caddy"
fi

# ── Step 5: Add iTerm2 tab alias ─────────────────────────────────────────────
step 5 "Add shell tab alias _$APP_NAME"

if grep -q "_${APP_NAME}()" "$TABS_FILE" 2>/dev/null; then
    yellow "Tab alias already exists"
else
    # Find the last _tab alias line and append after it
    printf '\n_%s()%s{ _tab "%s"%s"%s"%s%d  %d   %d; }\n' \
        "$APP_NAME" "       " "$APP_NAME" "             " "$APP_LABEL" "         " \
        "$APP_COLOR_R" "$APP_COLOR_G" "$APP_COLOR_B" >> "$TABS_FILE"
    green "Added _$APP_NAME alias to $TABS_FILE"
fi

# ── Step 6: Add vercel.json with ignoreCommand ───────────────────────────────
step 6 "Create vercel.json with ignoreCommand"

if [ -f vercel.json ]; then
    yellow "vercel.json already exists"
else
    cat > vercel.json <<'EOF'
{
  "ignoreCommand": "git log -1 --pretty=%B | grep -qE '^(chore|ci|test|docs):' && exit 0 || exit 1"
}
EOF
    green "Created vercel.json"
fi

# ── Step 7: Create .env.example ──────────────────────────────────────────────
step 7 "Create .env.example"

if [ -f .env.example ]; then
    yellow ".env.example already exists"
else
    cat > .env.example <<'EOF'
# Frames - no env vars required for basic usage
# Add API keys here if rate limiting or auth is added later
EOF
    green "Created .env.example"
fi

# ── Step 8: Install Husky + pre-push hook ────────────────────────────────────
step 8 "Set up Husky pre-push hook (typecheck only)"

if [ -d .husky ]; then
    yellow "Husky already initialized"
else
    npm install -D husky --silent 2>/dev/null
    npx husky init 2>/dev/null
    green "Husky initialized"
fi

# Write pre-push hook (typecheck only - never full build)
mkdir -p .husky
cat > .husky/pre-push <<'EOF'
npm run typecheck
EOF
chmod +x .husky/pre-push

# Remove default pre-commit if it just runs npm test placeholder
if [ -f .husky/pre-commit ] && grep -q "npm test" .husky/pre-commit; then
    rm .husky/pre-commit
    green "Removed placeholder pre-commit hook"
fi

green "Pre-push hook set to typecheck"

# ── Step 9: Add security headers to next.config.ts ───────────────────────────
step 9 "Add security headers to next.config.ts"

if grep -q "X-Frame-Options" next.config.ts 2>/dev/null; then
    yellow "Security headers already configured"
else
    cat > next.config.ts <<'EOF'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Frame-Options", value: "DENY" },
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
                    { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
                ],
            },
        ];
    },
};

export default nextConfig;
EOF
    green "Security headers added to next.config.ts"
fi

# ── Step 10: npm audit ───────────────────────────────────────────────────────
step 10 "Run npm audit"

AUDIT_OUTPUT=$(npm audit 2>&1 || true)
if echo "$AUDIT_OUTPUT" | grep -q "found 0 vulnerabilities"; then
    green "Zero vulnerabilities"
else
    yellow "Audit output:"
    echo "$AUDIT_OUTPUT" | tail -5
fi

# ── Summary ──────────────────────────────────────────────────────────────────
printf '\n'
green "=========================================="
green "  Onboarding complete for: $APP_NAME"
green "=========================================="
printf '\n'
echo "  Local:    http://localhost:$APP_PORT"
echo "  Caddy:    http://$APP_NAME.localhost"
echo "  iTerm2:   _$APP_NAME"
echo "  API:      POST /api/frame"
printf '\n'
yellow "Manual steps remaining:"
echo "  - source ~/.claude-tabs.sh"
echo "  - Set GitHub repo description + topics"
echo "  - Push to deploy on Vercel"
echo "  - Run Lighthouse audit"
echo "  - Add screenshot to local-apps gallery"
printf '\n'
