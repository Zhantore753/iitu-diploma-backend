# Deploying to Railway

This backend (NestJS + Prisma/Postgres + Redis + local file uploads) deploys to
[Railway](https://railway.app) as one service plus two managed plugins.

## 1. Push your code to GitHub

Railway deploys from a Git repo. Make sure your latest changes are pushed:

```bash
git add .
git commit -m "Add Railway deploy config"
git push
```

## 2. Create the project

1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
2. Pick this repository. Railway auto-detects Node and builds with Nixpacks.
   The build/start commands are already defined in [`railway.json`](railway.json):
   - **Build:** `prisma generate` runs via the `postinstall` script, then `nest build`.
   - **Start:** `npx prisma migrate deploy && node dist/src/main.js` — runs your
     migrations on every deploy, then boots the app.

## 3. Add Postgres and Redis

In the project canvas: **New** → **Database** → add **PostgreSQL**, then again for **Redis**.

Railway automatically injects:
- `DATABASE_URL` → used by Prisma.
- `REDIS_URL` → used by both the cache layer and the Redis service.

If they aren't auto-linked to your app service, add them as variable references
in the app's **Variables** tab:
- `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
- `REDIS_URL` = `${{Redis.REDIS_URL}}`

## 4. Set the remaining environment variables

In the app service → **Variables**, add everything from [`.env.example`](.env.example)
that isn't auto-provided. At minimum:

| Variable | Notes |
|---|---|
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | Use long random strings |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Initial admin login |
| `ANTHROPIC_API_KEY` | Your Anthropic key |
| `NODE_ENV` | `production` |

Do **not** set `PORT` — Railway provides it and the app reads `process.env.PORT`.

## 5. Add a persistent volume for uploads

Uploaded files are written to `./uploads` ([file.service.ts](src/file/file.service.ts),
[main.ts](src/main.ts)). Railway's filesystem is ephemeral, so without a volume
these vanish on every redeploy.

App service → **Settings** → **Volumes** → **New Volume**, mount path:

```
/app/uploads
```

(The app runs from `/app`, so this matches `process.cwd()/uploads`.)

## 6. Expose the service

App service → **Settings** → **Networking** → **Generate Domain**. You'll get a
`https://<name>.up.railway.app` URL. Swagger docs are at `/api`.

## 7. Seed the database (demo data, ≥20 rows per table)

Migrations run automatically. The seed ([prisma/seed.ts](prisma/seed.ts)) loads
demo users, machines, rentals, reviews, etc. — at least 20 rows per table. It's
**idempotent** (safe to run repeatedly).

**Easiest (no shell needed):** set `SEED_ON_DEPLOY=true` in the service Variables,
then redeploy. The start command runs the compiled seed once before booting.
Set it back to `false` afterward so future deploys boot faster.

**Or run it on demand** (service shell, or `railway run` locally with the project linked):

```bash
npm run seed:prod   # runs the compiled seed (dist/prisma/seed.js — no ts-node needed)
```

The seed downloads sample machine photos to the `/app/uploads` volume; if that
isn't available it transparently falls back to remote image URLs, so seeding
never fails on that account.

Default admin login after seeding: `admin@agri-rental.local` / `Admin12345!`

## Local development

`docker-compose up -d` still starts Postgres (`:5433`) and Redis (`:6380`) locally.
Copy `.env.example` → `.env` and fill it in. The Redis module uses `REDIS_URL` when
set and otherwise falls back to `REDIS_HOST`/`REDIS_PORT`.
