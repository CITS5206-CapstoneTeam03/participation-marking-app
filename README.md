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

#### Environment variables (`api/.env`)
Create `api/.env` by copying `api/.env.example`, then fill in the required values.

`api/partimark_app/core/config.py` loads settings from `api/.env` and requires `PASETO_SECRET_KEY` for auth token signing. Generate a local secret:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

Then set the existing `PASETO_SECRET_KEY` entry in `api/.env`:

```env
PASETO_SECRET_KEY=<generated-value>
```

Keep this value private and do not commit it. The backend will fail to start if `PASETO_SECRET_KEY` is missing or left blank.

Note: `.env` files are ignored by git (won’t be committed).

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

## Manually Running CI/CD (GitHub Actions)

The website is configured for automated deployment, but automatic deployment on push may be temporarily disabled. You can manually trigger deployments for the Frontend and Backend using GitHub Actions:

1. Go to the **Actions** tab on the GitHub repository page.
2. In the left sidebar (under Workflows), select the workflow you want to deploy:
   - **Azure Static Web Apps CI/CD**: for the Frontend.
   - **Build and deploy Python app to Azure Web App - partimark**: for the Backend (FastAPI).
3. Click the gray **Run workflow** button on the right side of the screen.
4. Select the branch you want to deploy (usually `main`) and click the green **Run workflow** button to start the deployment.

## Localhost
### http://localhost:4280

## FastAPI Swagger
### http://localhost:8000/docs

## Live Production
### https://partimark.app
