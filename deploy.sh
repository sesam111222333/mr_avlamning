#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🚀 Deploying to production..."

# Stage all changes
git add -A

# Commit (or skip if nothing to commit)
git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')" || echo "Nothing new to commit"

# Push to production server (triggers build & restart)
git push production main

echo ""
echo "🎉 Done! Check output above for deployment status."
