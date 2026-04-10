# Publish To GitHub

This repository is already initialized locally, but it does not yet have a Git remote.

## 1. Create the GitHub repository

Create an empty GitHub repository first, for example:

- `night-food-family-platform`

Do not add a README or `.gitignore` in GitHub, because this repo already has them locally.

## 2. Connect the local repo to GitHub

Replace the URL below with your own repository URL:

```bash
git remote add origin https://github.com/<your-account>/<your-repo>.git
```

Verify it:

```bash
git remote -v
```

## 3. Commit the current project

```bash
git add .
git commit -m "feat: initialize night food family platform"
```

## 4. Push to GitHub

```bash
git push -u origin master
```

If your GitHub repository uses `main` instead of `master`, rename the branch first:

```bash
git branch -M main
git push -u origin main
```

## 5. Connect the repo in Cloudflare

After the code is on GitHub:

1. Open Cloudflare dashboard
2. Go to `Workers & Pages`
3. Create a new Worker from Git
4. Point one Worker at `apps/web`
5. Point another Worker at `apps/admin`

Then follow:

- [cloudflare-workers-builds.md](/C:/Users/gsx/Documents/New%20project%202/docs/cloudflare-workers-builds.md)
