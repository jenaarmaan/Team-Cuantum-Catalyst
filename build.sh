#!/usr/bin/env bash
# exit on error
set -o errexit

echo "====== BUILDING FRONTEND ======"
cd frontend
npm install
npm run build
cd ..

echo "====== SETTING UP BACKEND ======"
cd backend
pip install -r requirements.txt
cd ..

echo "====== NYASA BUILD COMPLETE ======"
