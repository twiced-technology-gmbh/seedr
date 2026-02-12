# Git Workflow

## Never Cherry-Pick Between Branches

Do NOT use `git cherry-pick` to sync commits across branches (`main`, `prod`, `feat/*`).
Cherry-pick creates different commit SHAs, which breaks CI workflows that push between branches.

Instead, when pushing a commit to multiple branches:
1. Commit and push to `main` first
2. Merge `main` into the other branches: `git checkout prod && git merge main && git push origin prod`
3. This preserves identical commit SHAs across branches
