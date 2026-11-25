# Zettos Interior Units — Backend

Fastify API, PostgreSQL schema, Prisma data access and administrative endpoints. This directory is an independent Node.js application; the frontend is in `../frontend/`.

## Requirements and local setup

- Node.js 20+
- PostgreSQL
- Cloudinary and a Resend account are optional; email is disabled by default.

```powershell
Set-Location backend
npm install
Copy-Item .env.example .env
```

Set `DATABASE_URL` in `.env`, then generate the client and apply the committed initial migration:

Replace the example database URL with a valid PostgreSQL connection string. PostgreSQL must be running, and the `zettos` database must exist before starting the API.

```powershell
npm run db:generate
npm run db:deploy
npm run db:seed
npm run admin:create
npm run dev
```

The API listens on `http://localhost:4000`; `/api/health` checks database connectivity. Set `FRONTEND_ORIGINS` to a comma-separated list of exact frontend origins (for example `http://localhost:4001,https://www.example.com`). The legacy single `FRONTEND_ORIGIN` setting is also accepted. Run the website separately from `frontend/`.

## Environment

See `.env.example`. `DATABASE_URL` is required. Session cookies are HTTP-only and secure in production. Cloudinary credentials are only required when uploading files; without them, upload requests return an explicit configuration error. Outbound email remains disabled unless `EMAIL_ENABLED=true` and valid Resend settings are supplied. Do not put backend secrets in frontend environment variables.

Uploads are proxied through the API and checked for size, content type and file signature before being sent to Cloudinary. Enquiry attachments use authenticated/private delivery and admin project/service images use public delivery. Admin downloads of enquiry attachments use short-lived Cloudinary private download URLs.

## API outline

All successful responses use a `data` property; paginated endpoints also return `meta`. Errors use `{ "error": { "code": "...", "message": "..." } }`.

### Public

- `GET /api/health`
- `GET /api/public/projects` (filters: `page`, `pageSize`, `q`, `category`, `status`)
- `GET /api/public/projects/:slug`
- `GET /api/public/project-categories`
- `GET /api/public/services` and `GET /api/public/services/:slug`
- `GET /api/public/faqs`, `GET /api/public/testimonials`, `GET /api/public/settings`
- `POST /api/public/enquiry-uploads` (multipart field: `file`)
- `POST /api/public/enquiries`

### Authentication

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `POST /api/auth/password-reset`
- `POST /api/auth/password-reset/complete`

Password reset responses do not disclose whether an email belongs to an active admin. Reset tokens are single-use, hashed at rest and expire after 30 minutes.

### Admin (authenticated session required)

- `GET /api/admin/dashboard`
- Project/category CRUD: `/api/admin/projects`, `/api/admin/project-categories`
- Service CRUD and image upload: `/api/admin/services`, `POST /api/admin/media?kind=project` or `?kind=service` (multipart field: `file`)
- Enquiries: `GET /api/admin/enquiries`, `GET /api/admin/enquiries/:id`, `PATCH /api/admin/enquiries/:id`, notes, attachment download and CSV export
- FAQ CRUD: `/api/admin/faqs`
- Testimonial CRUD: `/api/admin/testimonials`
- Site settings: `GET` and `PUT /api/admin/settings` (Super Admin only)
- Admin account list/create: `GET` and `POST /api/admin/users` (Super Admin only)

Content endpoints are available to Super Admins and Content Managers. Mutating and admin requests also enforce the configured frontend origin. Login and public submission/upload endpoints have rate limits.

## Data initialization and scripts

`npm run db:seed` imports the current project and service content from `frontend/src/data/site.ts`. Concept portfolio entries are explicitly marked as concepts; the two local site-progress photos are kept as ongoing entries and retain their pending-confirmation descriptions.

- `npm run db:generate` — generate Prisma Client
- `npm run db:migrate -- --name <name>` — create/apply a development migration after schema changes
- `npm run db:deploy` — apply committed migrations in production
- `npm run db:seed` — seed/upsert site content
- `npm run admin:create` — interactively create the first Super Admin (password input is not echoed)
- `npm run typecheck`, `npm run build`, `npm test`

## Deployment

Deploy this API independently from the frontend. Set `NODE_ENV=production`, `FRONTEND_ORIGINS`, a managed PostgreSQL `DATABASE_URL`, a strong session configuration and integration credentials as needed. Run `npm run db:deploy` before switching traffic. Keep Cloudinary credentials server-side and grant only the required account access.
