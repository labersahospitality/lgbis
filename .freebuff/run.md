# LGBIS Dev Server

## Reproduce uncommitted artifacts

- `.env.local` already exists in this checkout (Supabase placeholder values). Copy from main checkout if missing:
  ```
  copy ..\.env.local .env.local
  ```
- Dependencies already installed (`node_modules` present). If missing, run `npm install`.

## Run the server

```bash
npm run dev -- -p 3456
```

Port: **3456** (3000 and 3001 were occupied by other processes).

## Current status

- Server running on PID 14824, port 3456
- Responds with 307 redirect on `/` (redirects to `/management`)
- Login page at `/login`
