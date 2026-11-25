# Zettos Interior Units — Frontend

The public website is a standalone TanStack Start application. The API is maintained separately in `../backend/`; there is no root package or shared workspace.

```text
frontend/  TanStack Start + React public website and admin UI
backend/   Fastify API, PostgreSQL schema, migrations, and seed scripts
```

## Local development

Requirements: Node.js 20+.

```powershell
Set-Location frontend
npm install
Copy-Item .env.example .env
npm run dev
```

The website runs at `http://localhost:4001`. To start the API, follow the setup instructions in [`../backend/README.md`](../backend/README.md).

If `VITE_API_BASE_URL` is unset, public pages use the bundled preview content. CMS and enquiry submissions still require the API; when the variable is set, public content is loaded from that API.

## Environment and secrets

- `frontend/.env.example` contains public `VITE_` website settings only. Values with the `VITE_` prefix are exposed in the browser bundle.
- `backend/.env.example` contains server-only database, session, mail and Cloudinary settings. Never put these credentials in frontend variables or source control.
- Create the first Super Admin with `npm run admin:create`; credentials are read interactively and are not seeded as defaults.

## Application

The frontend includes the responsive public pages, the filterable concept portfolio, two user-supplied ongoing site-progress photos, and the CEO portrait. Real project details that have not been supplied remain unpublished or labelled as pending confirmation.

The backend is a separate API service. Current data models and endpoint coverage are documented in [`../backend/README.md`](../backend/README.md).

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
```

## Deployment

Deploy `frontend/` and `backend/` as separate services. Set each service's environment variables independently. Configure `FRONTEND_ORIGINS` as a comma-separated list containing the local and production website origins, and set `VITE_API_BASE_URL` to the backend URL. Apply database migrations from `backend/`; do not run development migrations in production.

For Vercel, set the project root directory to `frontend/`. The `vercel.json` framework preset enables the TanStack Start integration so deep links are served by the application router rather than rewritten to the homepage.
