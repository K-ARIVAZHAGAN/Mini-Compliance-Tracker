# Mini Compliance Tracker

A full-stack compliance tracker for managing filings, taxes, and operational compliance tasks across multiple clients.

## Senior-Style Project Structure

```text
Mini_Compliance _Tracker/
├── backend/
│   ├── data/
│   │   └── compliance.db
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
- SQLite persistent storage with automatic seed data
- Docker support for containerized run

## Tech Stack

- Backend: Node.js, Express
- Database: SQLite
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

2. Start the application

```bash
npm start
```

3. Open in browser

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

## Deployment (Required for Submission)

You can deploy this app quickly on Render, Railway, or Fly.io.

### Render Example

1. Push this repository to GitHub.
2. Create a new Web Service from the repo.
3. Use these settings:
   - Build command: `npm install`
   - Start command: `npm start`
   - Environment: `Node`
4. Deploy and copy the generated public URL.

## Required Submission Items

1. Deployed app link
2. GitHub repository link with commit history
3. Setup instructions (this README)
4. Tradeoffs and assumptions

## Assumptions

- Status is limited to `Pending` or `Completed`.
- Priority is limited to `Low`, `Medium`, `High`.
- Due date is stored as ISO date (`YYYY-MM-DD`).
- Authentication is out of scope for this assignment.

## Tradeoffs

- SQLite was chosen for speed of delivery and persistence without external infrastructure.
- Vanilla JavaScript frontend keeps complexity low and implementation transparent.
- API and UI prioritize assignment functionality over advanced enterprise concerns (auth, audit trails, role permissions).
