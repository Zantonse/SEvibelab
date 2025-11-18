# Task List App

A React-based task manager with AI assistance and Google Calendar integration.  
Built with Vite, React, OpenAI, and a small Node/Express backend.

---

## Features

- **Task management**
  - Title, priority (high/medium/low)
  - Type (work/personal)
  - Category (Output/Input/Maintenance/Connection/Recovery)
  - Effort level
  - Due date
  - Subtasks
- **AI features**
  - Rephrase tasks for clarity (with accept/reject before applying)
  - Daily summary of tasks due today (Pacific Time)
- **Comments**
  - Threaded comments per task (each save creates a separate comment with timestamp)
- **Calendar integration**
  - One-click “Add to Google Calendar” for tasks with due dates
  - In-app Google OAuth setup from Settings
- **Persistence**
  - Tasks auto-save to `localStorage` and survive reloads and browser restarts
- **Debugging**
  - Debug panel (🐛) showing structured logs for LLM and Calendar actions

---

## Prerequisites

- Node.js (v18+ recommended)
- npm
- A Google Cloud project with Calendar API enabled
- An OpenAI API key (for AI features)

---

## Project Structure (High-Level)

- `src/App.jsx` — main UI composition
- `src/hooks/useTasks.js` — task state, localStorage persistence
- `src/components/TaskItem.jsx` — a single task row (edit text, comments, AI rephrase, calendar button)
- `src/components/TaskList.jsx` / `CompletedTasks.jsx` — task groupings
- `src/components/SettingsModal.jsx` — OpenAI key + Google Calendar auth UI
- `src/components/DebugPanel.jsx` — log viewer
- `src/utils/openai.js` — OpenAI client and prompts
- `src/utils/mcpCalendarService.js` — frontend calendar helper (talks to backend)
- `src/utils/logger.js` — shared logger for app/LLM/calendar logs
- `server.js` — Node/Express backend for Google Calendar integration
- `BACKEND_SETUP.md` — backend-specific details (optional reference)

---

## Setup

### 1. Install dependencies

```bash
npm install
```

This installs both frontend and backend dependencies (React, Vite, Express, googleapis, etc.).

### 2. Google OAuth credentials

Place your OAuth client credentials file at:

```text
gcp-oauth.keys.json
```

This file should look like:

```json
{
  "installed": {
    "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
    "project_id": "...",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "YOUR_CLIENT_SECRET",
    "redirect_uris": ["http://localhost"]
  }
}
```

> Do **not** commit real credentials to GitHub. Use environment variables or a local-only file.

### 3. Set OpenAI API key

You have two options:

- **Option A: Vite env file**

  Create `.env.local`:

  ```bash
  VITE_OPENAI_API_KEY=sk-...
  ```

- **Option B: In-app Settings**

  1. Run the frontend (see below).
  2. Click **Settings** (⚙️).
  3. Paste your OpenAI API key and click **Save**.

---

## Running the App

You need **two processes**: backend (server) and frontend (Vite).

### 1. Start the backend server

```bash
npm run start:server
```

This:

- Runs `server.js` on port `3001`
- Exposes:
  - `POST /api/calendar/create-event`
  - `GET /api/health`
  - `GET /api/auth/status`
  - `GET /api/auth/url`
  - `POST /api/auth/token`

On start you should see logs like:

```text
🚀 Backend server running on port 3001
📅 Calendar API endpoint: http://localhost:3001/api/calendar/create-event
❤️  Health check: http://localhost:3001/api/health
🔗 Auth status: http://localhost:3001/api/auth/status
```

### 2. Start the frontend (Vite dev server)

In another terminal:

```bash
npm run dev
```

Default URL: `http://localhost:5173`

Vite is configured to proxy `/api` requests to `http://localhost:3001` (see `vite.config.js`).

---

## Google Calendar Authorization (In-App Flow)

1. Open the app in your browser: `http://localhost:5173`
2. Click **Settings** (⚙️).
3. Scroll to **Google Calendar Integration**.
4. Click **“Connect Google Calendar”**:
   - This opens a Google auth URL in a new tab.
5. Log in and grant Calendar permissions.
6. After redirect, copy the `code` parameter from the URL.
7. Back in Settings:
   - Paste the code into the **Authorization Code** field.
   - Click **“Exchange Code”**.
8. On success:
   - Tokens are saved to `google-tokens.json`.
   - Status changes to **✅ Connected**.

After this, the 📅 button on a task with a due date will create a Google Calendar event via the backend.

---

## AI Features

### Rephrase Task

- Click ✏️ on a task.
- The app calls OpenAI (`rephraseTaskWithLLM` in `src/utils/openai.js`).
- A panel shows:
  - Original text
  - Suggested text
  - ✅ Accept — updates the task text
  - ❌ Reject — discards the suggestion

### Summarize Today

- Click **📅 Summarize Today** at the top.
- The app:
  - Collects all tasks (active + completed) due **today** in **Pacific Time**.
  - Sends them to `summarizeTasksWithLLM`.
  - Shows the summary in a modal (with a **Copy** button).

---

## Task Persistence

Tasks are persisted using `localStorage` under key:

```text
taskListApp_tasks
```

Behavior:

- On startup:
  - `useTasks` loads any saved tasks and sets them into state.
- During usage:
  - Changes to tasks automatically trigger saving to `localStorage`.
- After reload/closing the browser:
  - Tasks are restored from `localStorage`.

If you ever need to inspect the data manually, open DevTools → Console and run:

```js
localStorage.getItem('taskListApp_tasks')
```

---

## Debugging

### Debug Panel

- Click **🐛 Debug** in the header.
- Shows live logs from:
  - `[LLM]` — OpenAI calls (categorize, rephrase, summary)
  - `[Calendar]` — backend calendar interactions
  - `[App]` — UI actions (button clicks, errors)
- You can:
  - Filter by source/level
  - Clear logs
  - Expand entries for details

### Backend Health Checks

From a terminal or browser:

```bash
curl http://localhost:3001/api/health
curl http://localhost:3001/api/auth/status
```

These confirm the server and auth state.

---

## Scripts

Available npm scripts (see `package.json`):

- `npm run dev` — run Vite dev server (frontend)
- `npm run build` — build frontend for production
- `npm run preview` — preview build
- `npm run start:server` — run backend server (`server.js`)
- `npm run dev:server` — same as above (alternate name)

---

## Deployment Notes

For GitHub:

- Commit **source code only**:
  - Do **not** commit `gcp-oauth.keys.json`, `google-tokens.json`, or real `.env` values.
- Document in your repo how to obtain and configure:
  - Google OAuth credentials
  - OpenAI API key
- For production, consider:
  - Moving secrets to environment variables
  - Hosting backend and frontend separately
  - Enforcing HTTPS and stricter CORS

---

## Troubleshooting

- **Tasks disappearing**:
  - Ensure you’re not in incognito/private mode.
  - Check `localStorage.getItem('taskListApp_tasks')` in browser console.
- **Calendar errors**:
  - Verify `/api/auth/status` shows `connected: true`.
  - Re-run the auth flow if needed.
- **CORS errors**:
  - Make sure backend runs on `3001` and Vite proxy is configured.
- **OpenAI errors**:
  - Check API key in Settings and console logs in the Debug panel.

---


