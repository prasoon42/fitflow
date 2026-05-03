# FitFlow

Virtual wardrobe: **Vite + React** in `frontend/`, **FastAPI** in `backend/`. This repo uses **npm workspaces** so you can install and run the UI from the root.

## Run the app

**1. Install (once, from repo root)**

```bash
npm install
```

**2. API (Terminal A)** — from `backend/`, with a virtualenv if you use one:

```bash
cd backend
pip install -r requirements.txt
# copy backend/.env.example → backend/.env and set MONGODB_URI, JWT_SECRET_KEY, etc.
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**3. Frontend (Terminal B)** — from repo root:

```bash
npm run dev
```

Dev server **prefers port 5174**. If that port is busy, Vite picks **5175**, **5176**, etc. — always open the **`Local:`** URL printed in the terminal (Cursor’s tab may still point at the wrong port until you change it).

**If you want to free 5174 on Windows** (old Vite left running):

```powershell
netstat -ano | findstr :5174
taskkill /PID <pid_from_last_column> /F
```

Then run `npm run dev` again.

Previewing a production build uses **`npm run preview`** → usually **`http://localhost:4173/`**.

Login/register calls the API at `VITE_API_BASE_URL` / `http://127.0.0.1:8000`; keep the backend running or auth will fail.

### It looks like an “old” version of the app

Your code lives under `frontend/src/`. Nothing is “lost” unless files were deleted on disk. If the UI does not match your latest edits:

1. **Use the same port the terminal prints** (this project defaults to **5174** for Cursor’s browser). If the tab and terminal ports differ, the page can be blank.
2. **Use the dev server, not a static folder:** run `npm run dev` from the repo root. Do not open `dist/index.html` in the file system or use “Live Server” on an old `dist` folder.
3. **Hard refresh** the page: `Ctrl+Shift+R` (Windows) or disable cache in DevTools and reload.
4. **Stop duplicate Vite processes** (only one `npm run dev` at a time). If Vite moves to another port, update the browser URL to match **`Local:`** in the terminal.
5. **Clear Vite’s cache** if things are still wrong: delete the `.vite` folder in the project (and `frontend/node_modules/.vite` if present), then run `npm run dev` again.

**Alternative:** `cd frontend && npm install && npm run dev` if you prefer not to use the root workspace.

### API URL (frontend)

All requests use `frontend/src/config.js`. Override with **`frontend/.env`**:

```bash
# frontend/.env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Copy from `frontend/.env.example`. Restart Vite after changing env vars.

## Scripts (root)

| Command        | Action              |
|----------------|---------------------|
| `npm run dev`  | Vite dev server     |
| `npm run build`| Production build → `frontend/dist/` |
