# Participation Marking App

A simple, user-friendly app for tutors to quickly and easily mark student participation in tutorials or workshops, freeing up time that can be used for giving valuable feedback.

## Project Structure

- `/`: Next.js frontend application (App Router)
- `.github/workflows/`: GitHub Actions workflows

## Getting Started

### Frontend

```bash
npm install
npm run dev
```

### Backend

#### 🐧 macOS / Linux
- **Set up backend with Makefile**
By default, the Makefile uses `PYTHON=python3`. Depending on your machine, the Python command can be either `python` or `python3`.
```bash
make backend-setup          # Create venv (.venv) and install api/requirements.txt
# If your machine uses `python` instead of `python3`:
# make backend-setup PYTHON=python

make backend-run
```

#### 🪟 Windows
```bash
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r api/requirements.txt
$env:PYTHONPATH = "api"
uvicorn main:app --reload --port 8000
```

### Linking Frontend and Backend using SWA CLI
Frontend, Backend and this SWA have to run in 3 separate terminals
```bash
npm run swa
```

SWA CLI will create a local address (for example `http://localhost:4280`) where:
- **Frontend** is served from the Next.js dev server.
- **`/api` routes** are proxied to the FastAPI backend running at `http://localhost:8000`.

## Localhost
### http://localhost:4280

## FastAPI Swagger
### http://localhost:8000/docs