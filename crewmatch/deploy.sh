#!/usr/bin/env bash
set -euo pipefail

# deploy.sh - helper to initialize a git repo and push to GitHub (if gh CLI available)
# Run from the crewmatch folder

REPO_NAME="crewmatch-site"

echo "Preparing repository for deployment..."

if [ ! -d .git ]; then
  git init
  git add --all
  git commit -m "chore: initial site commit"
  git branch -M main
else
  echo ".git already exists; skipping init"
fi

if command -v gh >/dev/null 2>&1; then
  echo "Detected GitHub CLI (gh). Creating repo and pushing..."
  gh repo create "$REPO_NAME" --public --source=. --remote=origin --push || {
    echo "gh repo create failed or repo exists; trying to push to existing remote..."
    git push -u origin main
  }
  echo "Repository created/pushed. Enable GitHub Pages in repo settings if needed." 
else
  echo "GitHub CLI not found. Please create a GitHub repo, add it as remote 'origin', then run:"
  echo "  git push -u origin main"
fi

echo "If you want automatic GitHub Pages deployment, ensure the repository's Pages settings uses the 'gh-pages' branch or setup the Actions workflow (already added)."
echo "To deploy with Firebase Hosting instead, see README_DEPLOY.md for instructions."
