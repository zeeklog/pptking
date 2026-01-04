#!/bin/bash

# Cloudflare Pages Build Script for PPT Visionary AI
set -e

echo "🏗️ Starting Cloudflare Pages build..."

# Enable corepack for yarn 4.x support
corepack enable

# Install dependencies with yarn
echo "📦 Installing dependencies with yarn..."
yarn install --immutable

# Build the application
echo "🔨 Building Next.js application..."
yarn build

# Generate Vercel output for Cloudflare Workers
echo "📦 Generating Vercel build output..."
npx vercel build

# Transform for Cloudflare Workers (removed deprecated --experimental-minify flag)
echo "⚡ Transforming for Cloudflare Workers..."
npx @cloudflare/next-on-pages --skip-build

echo "✅ Build completed successfully!"

# List output for verification
echo "📁 Output directory contents:"
ls -la .vercel/output/static/