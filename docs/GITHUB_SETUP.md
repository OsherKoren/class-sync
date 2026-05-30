# GitHub Setup Guide

After pushing code to GitHub, complete these steps to enable CI/CD.

---

## 1. Branch Protection Rules

### Protect `main` branch
1. Go to **Settings** → **Branches**
2. Click **Add rule** for branch `main`
3. Configure:
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
4. Select status checks:
   - ✅ `lint` (Lint & Type Check)
   - ✅ `test` (Tests)
   - ✅ `build` (Build Check)
5. Save

**Result:** Can't merge PRs to main unless all CI checks pass.

---

## 2. Secrets for Deployment

### If using Vercel deployment:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secrets (ask maintainer for values):
   - `VERCEL_TOKEN` — Vercel API token
   - `VERCEL_ORG_ID` — Vercel org ID
   - `VERCEL_PROJECT_ID` — Vercel project ID

**Without these:** Deploy workflow will fail (but that's OK until configured)

---

## 3. Test the CI Pipeline

1. Create a test PR:
   ```bash
   git checkout -b test/ci-setup
   echo "# Test" >> README.md
   git add README.md && git commit -m "test: verify CI"
   git push -u origin test/ci-setup
   ```

2. Open PR on GitHub
3. Watch **Checks** section:
   - See lint, test, build jobs running
   - All should pass (or show specific errors)
4. Close PR when verified

---

## 4. Optional: Add Status Badge

Add to README.md (top of file):
```markdown
[![CI](https://github.com/YOUR-USERNAME/class-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR-USERNAME/class-sync/actions)

[![Deploy](https://github.com/YOUR-USERNAME/class-sync/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR-USERNAME/class-sync/actions)
```

Replace `YOUR-USERNAME` with actual GitHub username.

---

## 5. Local Setup for Developers

When other developers clone the project:
```bash
git clone <repo>
cd class-sync
npm install  # Automatically sets up husky hooks
npm test tests/smoke.spec.ts  # Verify local setup
```

---

## Common Issues

### "CI workflow file not found"
- Workflows must be committed: `git log --oneline -- .github/workflows/`
- File path must be exactly `.github/workflows/ci.yml`

### "GitHub can't find workflow"
- Push to a branch (workflows don't run on local commits)
- Create PR to see workflows trigger

### "Status checks missing from protection rule"
- Run workflows once (create dummy PR to test)
- Then they appear in the protection settings dropdown

---

## Dashboard Monitoring

### GitHub Actions Tab
- **Workflows** — see CI/Deploy status per commit
- **All Workflows** — filter by status (success/failed)
- **Artifacts** — download test reports

### Commit Details
- Click commit hash in main branch
- Scroll to **Checks** section
- Click individual job for detailed logs

---

## Disabling CI (for emergency)

⚠️ **Not recommended**, but if needed:

1. Go to **Actions** tab
2. Click workflow name (e.g., "CI")
3. **Disable workflow** button (three dots)

Re-enable same way or via:
```bash
git push -o ci.skip  # Skip CI for this push
```

---

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Set branch protection on `main`
3. ✅ Add Vercel secrets (if deploying)
4. ✅ Test with dummy PR
5. ✅ Monitor first few real PRs
6. → Ready for team development!
