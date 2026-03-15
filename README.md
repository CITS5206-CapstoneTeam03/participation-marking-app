# Participation Marking App

A simple, user-friendly app for tutors to quickly and easily mark student participation in tutorials or workshops, freeing up time that can be used for giving valuable feedback.

## Project Structure

- `frontend/`: Next.js frontend application (App Router)
- `api/`: FastAPI backend application
- `.github/workflows/`: GitHub Actions workflows

## Getting Started

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd api
pip install -r requirements.txt
uvicorn main:app --reload
```
