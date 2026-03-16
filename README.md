# Participation Marking App

A simple, user-friendly app for tutors to quickly and easily mark student participation in tutorials or workshops, freeing up time that can be used for giving valuable feedback.

## Project Structure

- `/`: Next.js frontend application (App Router)
- `.github/workflows/`: GitHub Actions workflows

## Getting Started

### Frontend

```bash
npm install
```

### Backend (`/api`)

- **Set up backend with Makefile**

  By default, the Makefile uses `PYTHON=python3`. Depending on your machine, the Python command can be either `python` or `python3`.

  ```bash
  make backend-setup          # Create venv (.venv) and install api/requirements.txt
  ```

  If your machine uses `python` instead of `python3`:

  ```bash
  make backend-setup PYTHON=python
  ```

### Linking Frontend and Backend using SWA CLI

Run CLIs below in 3 separate terminals:

1. Frontend running at `http://localhost:3000` with:

   ```bash
   npm run dev
   ```

2. Backend running at `http://localhost:8000` with:

   ```bash
   make backend-run
   ```

3. You can use Azure Static Web Apps CLI to link frontend and backend:

   ```bash
   npm run swa
   ```

   SWA CLI will create a local address (for example `http://localhost:4280`) where:

   - **Frontend** is served from the Next.js dev server.
   - **`/api` routes** are proxied to the FastAPI backend running at `http://localhost:8000`.

## Localhost
### http://localhost:4280