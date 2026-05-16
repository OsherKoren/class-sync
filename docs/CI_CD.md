# CI/CD Pipeline

## Overview

ClassSync uses GitHub Actions for automated testing and deployment.

---

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Runs on every push to `main` or `dev`, and on all pull requests.

**Jobs:**
1. **Lint & Type Check** (2min)
   - ESLint validation
   - TypeScript type checking
   - Must pass before merge

2. **Tests** (5-10min)
   - Playwright smoke tests
   - Creates temporary PostgreSQL database
   - Uploads test report as artifact

3. **Build Check** (3-5min)
   - `npm run build` to verify app builds
   - Detects bundle issues early

4. **Status** (1sec)
   - Aggregates all job results
   - PR merge blocked if any job fails

**Protected branches:**
- `main` — requires all CI checks to pass before merging
- `dev` — CI checks run but don't block (can merge with failures for hotfixes)

---

### 2. Deploy Pipeline (`.github/workflows/deploy.yml`)

Runs only on push to `main` (after CI passes).

**Process:**
1. Wait for CI to complete (automatic)
2. Deploy to Vercel production
3. Comment on commit with deployment status

**Setup required:**
- Add secrets to GitHub repo settings:
  - `VERCEL_TOKEN` — from Vercel account
  - `VERCEL_ORG_ID` — from Vercel dashboard
  - `VERCEL_PROJECT_ID` — from Vercel project settings

---

## Local Development

### Before Committing
Pre-commit hooks run automatically:
```bash
git commit -m "my changes"
# → ESLint + TypeScript check runs automatically
# → Commit fails if issues found
# → Fix issues, stage changes, commit again
```

### Before Pushing
Optionally run tests locally:
```bash
npm test tests/smoke.spec.ts    # ~5s (recommended)
npm test                        # ~15-20s (full suite)
```

### Pull Request Workflow

1. Create feature branch: `git checkout -b feature/name`
2. Make changes
3. Commit (pre-commit hooks run)
4. Push: `git push -u origin feature/name`
5. Create PR on GitHub
6. CI runs automatically:
   - ✅ All checks pass → ready to merge
   - ❌ Any check fails → see details, fix, push again
7. Merge to `main` when approved
8. Deploy workflow runs automatically

---

## Viewing Results

### PR Checks
- View in PR: scroll to **Checks** section
- See individual job results
- Click "Details" to see logs

### Artifacts
- Test reports automatically uploaded
- Download from **Actions** tab → workflow run → Artifacts

### Deployment Status
- Check **Deployments** tab in repo
- View production URL and deployment history

---

## Troubleshooting

### "Workflow file not found"
- GitHub workflows live in `.github/workflows/`
- File must be committed to repo
- Run: `git log --oneline -- .github/workflows/`

### "CI failed on my PR"
1. Click "Details" on failed check
2. View logs to see what failed
3. Fix locally
4. Commit and push again (CI re-runs)

### "Linting failed in CI but passes locally"
- Different Node version? Check workflow vs local
- Different ESLint config? Check `.eslintrc`
- Run: `npm run lint` locally to debug

### "Tests timeout in CI"
- GitHub Actions may be slower
- Increase timeout in workflow (currently 10min for tests)
- Check if database migrations taking long

### "Vercel deploy failing"
- Check Vercel dashboard for build errors
- Verify env vars set in Vercel project settings
- Check `NEXTAUTH_*` secrets are configured

---

## Environment Secrets

### For CI (GitHub Secrets)
- Not needed for lint/type-check/smoke tests
- Required for: full integration tests, E2E tests, production deploy

### For Deployment (Vercel)
- `DATABASE_URL` — Neon connection string
- `NEXTAUTH_SECRET` — strong random string
- `NEXTAUTH_URL` — `https://class-sync.vercel.app` (production)
- `GOOGLE_ID`, `GOOGLE_SECRET` — OAuth credentials
- `TEACHER_EMAIL` — for dev/test accounts

---

## Performance

### Typical CI Run Times
| Job | Time |
|-----|------|
| Lint & Type Check | 2min |
| Tests | 5-10min |
| Build Check | 3-5min |
| **Total** | **10-17min** |

### Optimization Tips
- Test only changed files (if needed): use `--changed`
- Parallel jobs already enabled
- Cache disabled for now (can add if CI becomes slow)

---

## Future Improvements

- [ ] E2E tests for critical flows (signup, login, enrollment)
- [ ] Coverage reports
- [ ] Performance benchmarks
- [ ] Automated changelog generation
- [ ] Release automation (versioning, tags)
- [ ] Slack/Discord notifications on deploy

---

## Resources

- [GitHub Actions Docs](https://docs.github.com/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Workflow Syntax](https://docs.github.com/workflows/workflow-syntax-for-github-actions)
