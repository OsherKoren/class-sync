# Development Guide

## Local Setup

### Prerequisites
- Node.js 18+ (check with `node --version`)
- npm or yarn
- PostgreSQL via Neon (connection string in `.env.local`)

### Initial Setup
```bash
npm install
npm run dev
```

Dev server runs at **http://localhost:3000**

---

## Testing

### Smoke Tests (Fast)
Quick validation that pages load correctly:
```bash
npm test tests/smoke.spec.ts
```

**Coverage:**
- Register & login pages load
- Student routes are protected
- Home page accessible

### Full Test Suite
Comprehensive browser automation tests (slower):
```bash
npm test
```

### Interactive Testing
Run tests with visual UI:
```bash
npm run test:ui
```

### Debug Mode
Step through tests with inspector:
```bash
npm run test:debug
```

### Manual Browser Testing
For detailed QA workflows, see:
- `docs/BROWSER_TESTING_GUIDE.md` — 10 comprehensive scenarios
- `docs/TESTING_SUMMARY.md` — quick-start reference

---

## Git Workflow

### Branches
- `main` — production code (protected)
- `dev` — development branch
- Feature branches off `dev`

### Pre-Commit Hooks (Coming Soon)
When set up, automatically runs:
- `eslint --fix` — fix linting issues
- `prettier` — format code
- `tsc --noEmit` — type checking

These are **fast** (~1-2s) and must pass before committing.

### Before Pushing
1. Run tests locally: `npm test tests/smoke.spec.ts`
2. Check console for errors: `npm run dev` in browser (F12)
3. Manual testing of changed features

### CI/CD Pipeline (Coming Soon)
When GitHub Actions is configured:
- Runs full test suite on all PRs
- Type checking
- Linting verification
- **Must pass before merging to main**

---

## Code Quality

### Type Checking
```bash
npx tsc --noEmit
```

### Linting
```bash
npm run lint
```

---

## Project Structure

### Key Directories
- `app/` — Next.js App Router pages & layouts
- `components/` — React components
- `lib/` — Business logic, database queries, utilities
- `prisma/` — Database schema & migrations
- `tests/` — Playwright test files
- `docs/` — Project documentation

### Naming Conventions
- **Files:** PascalCase for components, lowercase for utilities
- **Functions:** camelCase
- **Types:** PascalCase
- **Constants:** UPPER_SNAKE_CASE

### Component Structure
One component per file. ~80 lines max. If larger, split into smaller components.

```typescript
// components/MyComponent.tsx
"use client"; // Only if client-side interactivity needed

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  onSubmit: (data: string) => void;
};

export function MyComponent({ title, onSubmit }: Props) {
  return <div>{title}</div>;
}
```

---

## Database

### Schema Changes
1. Edit `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name add_feature_name
   ```
3. Verify changes: `npx prisma db push`
4. Generate types: `npx prisma generate`

### Querying Data
All queries go through `lib/` service functions. Never query in components:

```typescript
// ✅ Good: lib/actions/student.ts
export async function getStudentEnrollments(studentId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { studentId },
    select: { id: true, status: true, class: true },
  });
  return enrollments;
}

// ✅ Good: app/student/dashboard/page.tsx (Server Component)
const enrollments = await getStudentEnrollments(student.id);

// ❌ Bad: Client component calling database
const [enrollments, setEnrollments] = useState([]);
useEffect(() => {
  // Don't do this! Fetch from client!
}, []);
```

---

## Environment Variables

### `.env.local` (Never commit)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
GOOGLE_ID=...
GOOGLE_SECRET=...
TEACHER_EMAIL=your@email.com
```

Ask maintainer for values if joining the project.

---

## Common Tasks

### Add a New Page
1. Create `app/feature/page.tsx`
2. Add auth guard in `app/feature/layout.tsx` if needed
3. Import components, don't inline
4. Test routing & access control

### Add a New Database Model
1. Update `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Create queries in `lib/actions/`
4. Use in Server Components or Server Actions

### Fix a Bug
1. Create branch: `git checkout -b fix/issue-name`
2. Write test that fails (if applicable)
3. Fix the issue
4. Verify test passes
5. Push & create PR with description

### Performance Issues
1. Check Next.js Network tab: are API calls slow?
2. Check database: are queries efficient? Use `select` to limit fields
3. Check bundle: `npm run build` & check `.next/` size
4. Use React DevTools Profiler (F12 → Components tab)

---

## Troubleshooting

### "useSession must be wrapped in SessionProvider"
- ✅ Fixed: `app/providers.tsx` added to `app/layout.tsx`
- See: `app/providers.tsx`

### Database connection issues
- Check `.env.local` has `DATABASE_URL`
- Test: `npx prisma db execute --stdin < <<'EOF' SELECT 1; EOF`

### Port 3000 in use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process (Windows)
taskkill /PID <pid> /F
```

### Tests timing out
- Dev server running? Check `http://localhost:3000`
- Playwright browsers installed? `npx playwright install`
- Database accessible? Check env vars

---

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs/)
- [NextAuth.js Docs](https://next-auth.js.org)
- [shadcn/ui](https://ui.shadcn.com)
- [Playwright Testing](https://playwright.dev/docs/intro)

---

## Getting Help

- Check existing issues & PRs
- Review code comments & commit messages
- Ask in team Slack/Discord
- Create an issue with:
  - What you're trying to do
  - What you expected
  - What actually happened
  - Steps to reproduce
