# Mini Compliance Tracker

A full-stack compliance tracker for managing filings, taxes, and operational compliance tasks across multiple clients.

## Senior-Style Project Structure

```text
Mini_Compliance _Tracker/
├── backend/
│   ├── src/
│   │   ├── app.js
│   │   ├── db/
│   │   │   └── database.js
│   │   ├── routes/
│   │   │   ├── clients.js
│   │   │   └── tasks.js
│   │   └── utils/
│   │       └── taskValidation.js
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── Dockerfile
├── package.json
└── README.md
```

## Live Features

### Core Requirements

- Client list with selection
- Task list for selected client
- Add new compliance task
- Update task status (Pending/Completed)
- Filter tasks by status and category
- Overdue pending tasks highlighted clearly

### Additional Features

- Search tasks by title, description, or category
- Sorting by due date, priority, and title
- Summary stats (total, pending, completed, overdue, filtered count)
- PostgreSQL (Neon) persistent storage with automatic seed data
- Docker support for containerized run

## Tech Stack

- Backend: Node.js, Express
- Database: PostgreSQL (Neon)
- Frontend: HTML, CSS, Vanilla JavaScript

## Data Models

### Client

- id
- company_name
- country
- entity_type

### Compliance Task

- id
- client_id
- title
- description
- category
- due_date
- status
- priority

## API Endpoints

- `GET /api/clients`
- `POST /api/clients`
- `GET /api/clients/:id/tasks`
  - Query params: `status`, `category`, `q`, `sort_by`, `sort_dir`
- `GET /api/clients/:id/tasks/stats`
- `POST /api/clients/:id/tasks`
- `PATCH /api/tasks/:id/status`

## Local Setup

1. Install dependencies

```bash
npm install
```

2. Configure environment

macOS/Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `.env` using your Neon connection string.

3. Start the application

```bash
npm start
```

4. Open in browser

- http://localhost:3000

## Docker Setup (Optional Bonus)

1. Build image

```bash
docker build -t mini-compliance-tracker .
```

2. Run container

```bash
docker run -p 3000:3000 mini-compliance-tracker
```

## Deployment on Netlify

This project is configured for Netlify using:

- Static frontend from `frontend/`
- Express API via Netlify Function at `netlify/functions/api.js`
- Route rewrite from `/api/*` to `/.netlify/functions/api/*`

### Steps

1. Push this repository to GitHub.
2. In Netlify, select **Add new project** and import this repo.
3. Add environment variable in Netlify:
  - `DATABASE_URL`: your Neon connection string
4. Keep default build settings from `netlify.toml`:
  - Publish directory: `frontend`
  - Functions directory: `netlify/functions`
5. Deploy.

### Quick Links

- GitHub Repository: https://github.com/K-ARIVAZHAGAN/Mini-Compliance-Tracker
- One-click Netlify import: https://app.netlify.com/start/deploy?repository=https://github.com/K-ARIVAZHAGAN/Mini-Compliance-Tracker

### Important Database Note

This app is configured for Neon Postgres to keep data persistent on Netlify Functions.

If `DATABASE_URL` is missing or invalid, API routes will fail until Netlify env variables are updated.

## Deployment Verification Checklist

Run these checks after every production deploy:

1. Open deployed app:
  - https://mini-compliance-tracker-v-0-1.netlify.app/
2. Verify API health:
  - `GET /api/clients` returns `200` with JSON.
3. Create a new task from UI and verify:
  - task appears in list,
  - filters work,
  - status update works,
  - overdue style appears for pending past-due tasks.

## Troubleshooting

### API returns 502 on Netlify

Most common root cause: missing or incorrectly scoped `DATABASE_URL`.

Fix:

1. Open the same Netlify site used by production URL.
2. Set `DATABASE_URL` in Environment Variables.
3. Scope it to **All deploy contexts** (or explicitly include Production).
4. Trigger **Clear cache and deploy site**.

### Local app works, deployed app fails

This usually means local `.env` is correct but Netlify runtime environment is not. Re-check Netlify variable key/value and deploy context.

## Security Notes

- Never commit `.env`.
- If a DB URL/password is exposed in chat/logs, rotate credentials immediately in Neon.
- Update Netlify `DATABASE_URL` after rotation and redeploy.

## Future Hardening (Post-Assignment)

- Add auth for write routes.
- Add rate limiting on POST/PATCH endpoints.
- Add pagination limits for large datasets.
- Add monitoring and alerts for API failures.

## Required Submission Items

1. Deployed app link: https://mini-compliance-tracker-v-0-1.netlify.app/
2. GitHub repository link with commit history: https://github.com/K-ARIVAZHAGAN/Mini-Compliance-Tracker
3. Setup instructions (this README)
4. Tradeoffs and assumptions

## Assumptions

- Status is limited to `Pending` or `Completed`.
- Priority is limited to `Low`, `Medium`, `High`.
- Due date is stored as ISO date (`YYYY-MM-DD`).
- Authentication is out of scope for this assignment.

## Tradeoffs

- Neon Postgres was chosen to ensure persistence and reliability on Netlify serverless infrastructure.
- Vanilla JavaScript frontend keeps complexity low and implementation transparent.
- API and UI prioritize assignment functionality over advanced enterprise concerns (auth, audit trails, role permissions).
