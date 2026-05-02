# FitFlow API

FastAPI service for FitFlow: JWT auth, MongoDB wardrobe, YOLO garment detection, outfit recommendation, and optional Cloudinary / remove.bg integrations.

## Requirements

- **Python 3.11+** (3.12 works)
- **MongoDB** running and reachable
- **YOLO weights** at `ml/best.pt` (training artifact — not committed; copy into `backend/ml/` locally or use [Git LFS](https://git-lfs.com/) if you version weights)

## Quick start

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit **`.env`**: set `MONGODB_URI`, `JWT_SECRET_KEY`, and optional keys from `.env.example`.

Run the API:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

- **Interactive docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- The Vite app expects the API at **`http://127.0.0.1:8000`** unless `VITE_API_BASE_URL` overrides it.

## Layout

| Path | Role |
|------|------|
| `main.py` | FastAPI app, routes, `/uploads` static mount |
| `auth.py` | JWT + password hashing |
| `db.py` | MongoDB + optional Cloudinary |
| `ml/` | Detection (`detect.py`, `best.pt`), colors, recommender, shopping helpers |
| `uploads/` | User images (empty except `.gitkeep` in repo) |

## Production notes

- Use a strong `JWT_SECRET_KEY` and HTTPS in front of uvicorn.
- Configure `CLOUDINARY_*` if you serve images from Cloudinary instead of local `/uploads`.
