# NYASA — Deployment Guide

NYASA has been updated to support **unified single-platform hosting**. By building the React frontend and copying it into the FastAPI backend's `dist/` directory, you can run the entire application on a **single port and domain**, completely avoiding CORS issues and reducing hosting costs.

---

## 🚀 Recommended Platforms for Hackathon Deployment

### 1. Render (Recommended — Free & Simplest)
Render is the easiest platform to host a unified FastAPI + React app. It builds both, installs dependencies, and serves them.

#### Setup Steps:
1. Push your repository to **GitHub** or **GitLab**.
2. Go to [Render.com](https://render.com) and sign in.
3. Click **New** → **Web Service**.
4. Connect your GitHub repository.
5. Configure the service settings:
   - **Name**: `nyasa`
   - **Runtime**: `Python`
   - **Build Command**: `./build.sh` (This script builds the React frontend and sets up Python automatically)
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
6. Add your environment variables in the **Environment** tab:
   - `GEMINI_API_KEY`: *Your Google AI Studio Key*
   - `TAVILY_API_KEY`: *Your Tavily Search Key*
   - `CORS_ORIGINS`: *Leave blank or set to your Render URL*
7. Click **Deploy Web Service**. Render will automatically run the build script, bundle the frontend, and host it!

---

### 2. Railway (Fastest Deployments — Paid, Free Trial Credits)
Railway is extremely fast and auto-detects dependencies.

#### Setup Steps:
1. Go to [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Add your environment variables in the **Variables** tab:
   - `GEMINI_API_KEY`
   - `TAVILY_API_KEY`
   - `PORT`: (Railway injects this automatically)
4. Under **Settings** → **Build & Deploy**:
   - Custom Build Command: `cd frontend && npm install && npm run build && cd ../backend && pip install -r requirements.txt`
   - Custom Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
5. Click deploy. Railway will handle everything else.

---

### 3. Hugging Face Spaces (Perfect for AI Prototypes — Free CPU)
Hugging Face Spaces is great for presenting AI hackathon products. You can run both frontend and backend in a single Space using **Docker**.

#### Setup Steps:
1. Create a new Space on [Hugging Face](https://huggingface.co/spaces).
2. Select **Docker** as the SDK (use the blank template).
3. Create a [`Dockerfile`](file:///d:/projects/Team-Cuantum-Catalyst/Dockerfile) in the root of your project:
   ```dockerfile
   # Stage 1: Build React frontend
   FROM node:20-alpine AS frontend-builder
   WORKDIR /app/frontend
   COPY frontend/package*.json ./
   RUN npm install
   COPY frontend/ ./
   RUN npm run build

   # Stage 2: Serve using FastAPI backend
   FROM python:3.11-slim
   WORKDIR /app
   COPY backend/requirements.txt ./backend/
   RUN pip install --no-cache-dir -r backend/requirements.txt
   COPY backend/ ./backend/
   COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

   # Expose port 7860 (Hugging Face default)
   EXPOSE 7860
   CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
   ```
4. Go to **Settings** on your Hugging Face Space and add your API keys as Secrets (`GEMINI_API_KEY` and `TAVILY_API_KEY`).
5. Push your code to Hugging Face Git, and it will build and run automatically.

---

## 🛠️ Verification of Single-Platform Setup (Local Testing)

You can verify this single-service setup locally before pushing:

1. **Build the React frontend:**
   ```bash
   cd frontend
   npm run build
   ```
   This compiles the React files and assets into `frontend/dist/`.

2. **Start the FastAPI backend:**
   ```bash
   cd ../backend
   uvicorn app.main:app --reload --port 8000
   ```

3. **Open browser:**
   Go to `http://localhost:8000`. You will see the complete NYASA React app running directly from FastAPI!
