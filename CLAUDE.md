# class-sync — Engineering Guidelines

## Role
Senior full-stack engineer. Next.js 16 App Router, TypeScript, Prisma, Tailwind CSS.

## Stack
- Framework : Next.js 16 App Router + React 19 (TypeScript strict)
- Database  : Neon Postgres via Prisma ORM
- Auth      : NextAuth.js — Google OAuth (teacher) + credentials (families)
- UI        : shadcn/ui + Tailwind CSS
- i18n      : next-intl (Hebrew RTL default, English)
- Theme     : next-themes (system default, user override)
- PWA/Push  : serwist + web-push (VAPID)
- Deploy    : Vercel + Neon (free tier)

---

## TypeScript
- Strict mode always — no `any`, no unchecked casts
- Named exports everywhere; default exports only in `page.tsx` / `layout.tsx`
- Co-locate types with their feature; shared types in `lib/types.ts`
- No barrel `index.ts` re-exports — import directly from the source file

---

## Next.js Patterns
- Server Components by default — add `"use client"` only when required
- Fetch data in Server Components; never fetch on mount for initial render
- Mutations via Server Actions — no REST API routes for CRUD
- API routes only for: webhooks, push subscriptions, OAuth callbacks
- Heavy client components lazy-loaded via `next/dynamic`
- `app/` is routing only — business logic lives in `lib/` or `components/`

---

## Database
- Prisma client is a singleton in `lib/db.ts` — never instantiate inline
- All DB access through service functions in `lib/` — never in components
- Always use `select` in Prisma queries — never return full model objects
- Run `npx prisma generate` after every schema change

---

## Components
- One component per file; PascalCase filename = component name
- ~80 lines max per component — split if larger
- Props beyond 2 levels deep → use server props or context, not drilling
- `components/ui/` — shadcn managed; `components/<feature>/` — custom

---

## Styling
- Tailwind utility classes only — no custom CSS unless Tailwind cannot do it
- Conditional classes via `cn()` from `lib/utils.ts`
- Dark mode: `dark:` variants — never hardcode light/dark colors
- RTL: `rtl:` variants — test every layout in Hebrew and English

---

## Validation & Security
- Validate all inputs with zod on the server — never trust client data
- Never expose tokens, DB URLs, or VAPID keys to the client bundle
- Every mutation: session check before any DB write
- User-provided strings sanitized before storing or rendering

---

## Performance
- `next/image` for all images — never raw `<img>`
- `next/font` for fonts — never external font `<link>`
- `React.cache()` for repeated server-side fetches within a request

---

## Error Handling
- Server Actions return `{ error: string } | { data: T }` — never throw to client
- Route-level errors handled by `error.tsx` boundary files
- Log full errors server-side; show only safe generic messages to users

---

## Git
- One branch per feature; PR before merging to main
- Commit messages: imperative present tense ("add vote page", "fix RTL layout")
- No direct commits to main
