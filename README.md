# TinyLink – URL Shortener

TinyLink is a simple URL shortener built on top of Next.js (App Router) and Prisma.
It lets you create short codes for long URLs, track clicks, and view basic stats per short link.

## Features

- **Create short links** with custom codes (6–8 alphanumeric characters)
- **Copy short URLs** to the clipboard with a single click
- **Redirect** from `/[code]` to the original URL
- **View all links** on the dashboard with:
  - Original URL
  - Created date
  - Click count
  - Last accessed time
- **Validate codes in real time** (check if a short code is already taken)
- **Delete links** from the dashboard

## Tech Stack

- **Framework:** Next.js (App Router, TypeScript)
- **Database:** Prisma (via `@/lib/prisma`)
- **Styling:** Tailwind CSS-style utility classes (via global styles)

## Running the app

From the `tinylink` directory:

```bash
npm install
npm run dev
```

Then open: <http://localhost:3000>

Make sure you have a valid Prisma configuration and database set up (see `prisma/schema.prisma`),
and that you have run the Prisma migrations / `prisma db push` as needed.

## Key routes

### UI routes

- `/` – main dashboard listing all shortened links and a modal to create new links.
- `/[code]` – resolves the `code` to the original URL and redirects or shows info.
- `/code/[code]` – status/stats page for a specific short code.

### API routes

- `GET /api/links` – list all links.
- `POST /api/links` – create a new link.
  - Expected body: `{ originalUrl: string, code: string, lastAccessedAt?: string }`
- `DELETE /api/links/:code` – delete a link by its short code.
- `GET /api/links/check?code=XYZ` – check if a short code is available.
- `GET /api/links/:code` – fetch stats for a given short code.
- `GET /healthz` – health check endpoint
- `GET /code` – redirect to the original URL
- `GET /code/:code` – fetch stats for a given short code.


