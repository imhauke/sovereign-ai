# Sovereign AI

Private, on-premise AI platform powered by local LLMs via Ollama. No data leaves your machine.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind |
| Backend | FastAPI (Python) + SQLite |
| AI | Ollama + Qwen 3.5:9b (local) |

---

## Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **Ollama** — [ollama.com](https://ollama.com)

---

## Quick Start

### 1. Install and start Ollama + Qwen

```bash
# Install Ollama (macOS)
brew install ollama

# Start the Ollama service
ollama serve

# Pull the Qwen model (one-time, ~6.6 GB)
ollama pull qwen3.5:9b
```

To verify the model is running:

```bash
ollama ps
# Should show: qwen3.5:9b ... Forever
```

### 2. Backend

```bash
cd backend

# Create virtual environment (first time only)
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies (first time only)
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your GITHUB_TOKEN

# Start the API server
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
```

Backend available at `http://localhost:8080`

### 3. Frontend

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Start the dev server
npm run dev
```

Frontend available at `http://localhost:5173`

---

## Environment Variables

Create `backend/.env` from the example below:

```env
# Required for GitHub commits feature
GITHUB_TOKEN=your_github_pat_here

# Ollama configuration
OLLAMA_BASE=http://localhost:11434
MODEL=qwen3.5:9b
```

To generate a GitHub token: [github.com/settings/tokens](https://github.com/settings/tokens) — needs `repo` (read) scope.

---

## Verify Everything is Running

```bash
# Ollama + Qwen
curl http://localhost:11434/api/version

# Backend health (also shows model status)
curl http://localhost:8080/api/health
# Expected: {"status":"ok","model":"qwen3.5:9b","ollama_version":"..."}

# Frontend
open http://localhost:5173
```

---

## Features

- **Chat** — Streaming conversations with Qwen via Ollama, with persistent chat history
- **Document Analysis** — AI-powered analysis of pasted text or documents
- **GitHub Commits** — Agentic commit browser with AI summaries
- **Think Mode** — Toggle extended reasoning for complex queries

---

## Database

SQLite database is auto-created at `backend/sovereign.db` on first run. No manual setup required.

---

## Using a Different Model

Any model available in Ollama can be used. Change `MODEL` in `backend/.env`:

```bash
# Pull alternative model
ollama pull llama3.2:3b

# Update .env
MODEL=llama3.2:3b
```

---

## Production Build

```bash
cd frontend
npm run build
# Output in frontend/dist/
```
