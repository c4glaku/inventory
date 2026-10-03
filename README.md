# Inventory Manager

A local inventory management app for products and suppliers. It includes a React dashboard, an Express API, PostgreSQL storage, JWT-backed sessions, and JSON/CSV import and export.

## Requirements

- macOS, Windows, or Linux
- Node.js 24 LTS recommended; Node.js 22.12 or newer is required
- PostgreSQL 14 or newer, running locally or on a database host you can access

The old Windows-only installer has been replaced by a Node.js setup command that works across these operating systems. The app no longer needs the `psql` command line tool.

## First-time setup

From the project root:

```sh
npm ci
npm run setup
npm run dev
```

Setup asks for the PostgreSQL administrator connection and database settings. It creates a separate, non-superuser application role, initializes the schema without dropping existing tables, and asks for an initial admin account if the database has no users. It writes the generated database password and JWT signing key to `backend/.env`; on macOS/Linux the file is restricted to the current user, while Windows uses the project directory's filesystem ACL. Keep that file private.

Open <http://localhost:5173>. The API listens on <http://127.0.0.1:3000>.

To run an existing installation, start with `npm ci` and `npm run dev`. If the existing `backend/.env` uses a short JWT secret, replace it with at least 32 random bytes first. Setup refuses to overwrite an existing `.env`; move it to a secure backup outside the repository before running setup again. If you are upgrading from an older clone, back up `backend/.env` before pulling: it was tracked previously, and Git may remove it from the working tree as part of this update. The new setup keeps product, supplier, and user rows when it initializes an existing database.

To create a random JWT secret manually, use `openssl rand -base64 48` on macOS/Linux or:

```powershell
node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
```

Copy [backend/.env.example](backend/.env.example) to `backend/.env` only when configuring the app manually. Set the database connection fields and replace the example JWT secret before starting the API.

## Development and builds

```sh
npm run dev       # Start API and web app together
npm run build     # Create the frontend production bundle in frontend/dist
npm start         # Start only the API
```

For a separately hosted frontend, set `VITE_API_URL` to the API base URL at build time and set `CORS_ORIGINS` in `backend/.env` to the exact frontend origin. Same-site subdomains work with the default strict cookie setting. A truly cross-site frontend also needs `COOKIE_SAME_SITE=none`, `NODE_ENV=production`, and HTTPS; browser third-party-cookie rules may still block this setup. For production, serving `frontend/dist` and proxying `/api` through the same origin is the simplest option. Set `DB_SSL=true` when the PostgreSQL provider requires TLS.

## Features

- Dashboard totals, low-stock count, and quantity chart
- Product and supplier create, list, edit, and delete
- JSON and CSV export and transactional imports
- Light and dark themes
- Case-insensitive login with an HTTP-only, `SameSite=Strict` session cookie

CSV imports are limited to 10 MB and 5,000 rows; JSON requests are limited to 2 MB and 5,000 rows. CSV exports escape spreadsheet formula values. Imports validate all rows before committing them, so a failed import does not leave partial data.

## API

All data routes require a valid session cookie. The first admin can be created during setup; the public registration endpoint closes after the first account is created.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API health check |
| `POST` | `/api/auth/login` | Start a session |
| `POST` | `/api/auth/logout` | End a session |
| `GET` | `/api/auth/me` | Return the current account |
| `GET`, `POST` | `/api/products` | List or create products |
| `GET`, `PUT`, `DELETE` | `/api/products/:id` | Read, update, or delete a product |
| `GET`, `POST` | `/api/suppliers` | List or create suppliers |
| `GET`, `PUT`, `DELETE` | `/api/suppliers/:id` | Read, update, or delete a supplier |
| `GET` | `/api/export/json/:type` | Export products or suppliers as JSON |
| `GET` | `/api/export/csv/:type` | Export products or suppliers as CSV |
| `POST` | `/api/import/json/:type` | Import products or suppliers from JSON |
| `POST` | `/api/import/csv/:type` | Import products or suppliers from CSV |

## Security notes

- Passwords use bcrypt; passwords must be 12–72 UTF-8 bytes.
- Session JWTs are stored in HTTP-only cookies and are never kept in browser local storage.
- Login and registration are rate limited, CORS origins are restricted, and request bodies/uploads have size limits.
- The schema uses idempotent table creation and never drops application data.
- `.env` files and the old installer executable are excluded from the current repository snapshot.

**Credential rotation is required:** earlier commits included a PostgreSQL password and JWT secret in `backend/.env`. Removing the file from the current tree does not erase those values from old Git history or existing clones. Replace the old PostgreSQL password and JWT secret before relying on this repository. Old browser sessions should be considered invalid after the signing key changes. A normal pull or push does not rewrite prior commits.

## Data formats

Product CSV columns: `Name`, `Description`, `SKU`, `Quantity`, `Unit Price`, `Supplier ID`, `Minimum Quantity`, `Maximum Quantity`.

Supplier CSV columns: `Name`, `Contact Name`, `Email`, `Phone`, `Address`.
