#!/bin/bash

set -e

echo "Building the application..."
npm run build

echo "Copying index.html to 404.html for GitHub Pages routing..."
cp dist/index.html dist/404.html

echo "Replacing docs folder with new build..."
rm -rf docs
cp -r dist docs

echo "Staging files..."
git add .

echo "Committing changes..."
git commit -m "deploy: build application to docs for GitHub Pages" || true

echo "Configuring remote..."
git remote set-url origin https://github.com/chiaraefer/wedding.git

echo "Showing remotes..."
git remote -v

echo "Pulling latest changes from remote to prevent conflicts..."
git pull origin main --rebase

echo "Pushing to origin/main..."
git push origin main

echo "Deployed to main!"