# Career Mate

Native Expo app that evaluates job postings against a user's CV and helps them generate tailored application documents.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

- The mobile client talks directly to the existing Career Mate production API; no local database or backend routes are created.
- Access and refresh tokens are persisted with Expo SecureStore, and every 401 clears the session.
- Profile and job state use React Query; session/profile identity is shared through AuthContext.
- The API hostname is centralized in `artifacts/career-mate/lib/config.ts` and can be overridden with `EXPO_PUBLIC_CAREER_MATE_API_URL`.

## Product

- Email one-time-code sign-in against the deployed Career Mate API.
- Three-way CV setup: upload, paste, or guided intake.
- Three-way job evaluation: URL, pasted text, or uploaded file.
- Pipeline history, collapsible evaluation reports, and tailored CV/cover-letter generation.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
