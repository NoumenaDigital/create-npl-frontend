#!/bin/bash
set -euo pipefail

# Remove any previous test output
echo "Cleaning up old test output..."
rm -rf frontend

# Run the CLI to scaffold a new project
echo "Running create-npl CLI..."
npx --no-install ts-node src/index.ts --name frontend --tenant smoketest --app iou --package iou --force

# Check that key files exist
echo "Checking generated files..."
[ -f frontend/package.json ] || { echo "Missing package.json"; exit 1; }
[ -f frontend/tsconfig.json ] || { echo "Missing tsconfig.json"; exit 1; }

# Install dependencies in the generated project
echo "Installing dependencies in generated project..."
(cd frontend && npm install)

# Clean up
echo "Cleaning up..."
rm -rf frontend

echo "Smoke test passed!"
