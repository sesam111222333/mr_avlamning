#!/bin/bash
set -e

SERVER="root@192.168.206.106"
APP_DIR="/opt/mr-avlamning"
LOCAL_DIR="$HOME/Documents/programmering/mr-avlamning"

echo "🚀 Deploying mr-avlamning..."

# 1. Git commit and push (if git repo exists)
cd "$LOCAL_DIR"
if [ -d ".git" ]; then
  echo "📦 Committing and pushing..."
  git add -A
  git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "Nothing to commit"
  git push origin main 2>/dev/null || echo "Push skipped (no remote or error)"
fi

# 2. Sync files to server
echo "📤 Syncing files to server..."
rsync -avz --exclude='.next' --exclude='node_modules' --exclude='.git' \
  "$LOCAL_DIR/" ${SERVER}:${APP_DIR}/

# 3. SSH to server: clean cache, install, build, restart
echo "🧹 Clearing cache..."
ssh ${SERVER} "cd ${APP_DIR} && rm -rf .next node_modules/.cache"

echo "🔨 Building on server..."
ssh ${SERVER} "cd ${APP_DIR} && ~/.bun/bin/bun install && ~/.bun/bin/bun run build"

echo "🔄 Restarting app..."
ssh ${SERVER} "(pkill -f 'next start' ; true)"
ssh ${SERVER} "cd ${APP_DIR} && nohup ~/.bun/bin/bun run start </dev/null >/var/log/mr-avlamning.log 2>&1 &"

# Wait and verify
sleep 3
HTTP_CODE=$(ssh ${SERVER} "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000")

if [ "$HTTP_CODE" = "200" ]; then
  echo "🎉 Deploy complete! App running at http://192.168.206.106:3000"
else
  echo "❌ Deploy may have failed. HTTP status: $HTTP_CODE"
  echo "Check logs with: ssh ${SERVER} 'cat /var/log/mr-avlamning.log'"
  exit 1
fi
