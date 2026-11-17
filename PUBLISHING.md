# Publish this source to a new public GitHub repository

**GitHub-repository publication is safe only after your own final review.** Do not host the v0.1 Node HTTP service on a public network: demo actors are impersonable.

## Method A — GitHub website (simplest)

1. Go to https://github.com/new while signed in as **realxpen**.
2. Repository name: `commonsgate`. Description: `Synthetic-data proof of concept for community-governed AI research access.`
3. Choose **Public**. Do not initialise with a README, .gitignore or licence; these are included here.
4. Click **Create repository**.
5. On the empty repository, choose **uploading an existing file**, then upload the **contents** of this folder (including `src/`, `public/`, `tests/`, `docs/`, `assets/`, `.github/` and dotfiles). GitHub's website uploader may not preserve directories when dragged from some phones; desktop Git is more reliable.
6. Commit to `main` and inspect the README, images, tests and `.github/workflows/ci.yml`. Wait for the GitHub Actions checks.
7. Verify https://github.com/realxpen/commonsgate/ (only after you actually create it).

## Method B — Terminal (recommended for folders and hidden files)

After creating the **empty** public repository as above, open a terminal in this folder and run:

```bash
git init
git branch -M main
git add .
git commit -m "feat: publish CommonsGate synthetic policy lab v0.1"
git remote add origin https://github.com/realxpen/commonsgate.git
git push -u origin main
```

GitHub authentication must already be configured locally (GitHub CLI, browser credential manager or SSH). Never put a personal access token into a published command or file.

## Reviewer checklist

- README displays the desktop screenshot and explicit synthetic-data warning.
- `npm test` passes 20 tests and `npm run check` passes locally.
- The Actions workflow should pass for Node 20/22/24 after upload (this is not locally verifiable for all three versions).
- There are **no real individuals, external data sources, healthcare claims or production authentication**.
- Public GitHub source is the deliverable, **not** a publicly hosted API.

If you create the repository in GitHub, this connected ChatGPT conversation can continue with repository-level inspection and updates using the GitHub integration.
