# Deploying CrewMatch (quick guides)

This file contains step-by-step instructions to publish the site and get a shareable URL.

Options provided:
- GitHub Pages (recommended for simple static hosting)
- Firebase Hosting (Google-backed)
- Netlify / Vercel (drag-and-drop or repo import)

1) GitHub Pages (automatic via GitHub Actions)

- Prereqs: `git`, and optionally `gh` (GitHub CLI) for convenience.
- From the `crewmatch` folder run:

```bash
chmod +x deploy.sh
./deploy.sh
```

- If you used `gh` the script will create a repo named `crewmatch-site` and push `main`.
- If you didn't use `gh`, create a GitHub repo manually, add the remote, and push:

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

- The included GitHub Actions workflow (`.github/workflows/gh-pages.yml`) will run on push to `main` and publish the repository root to GitHub Pages. After the workflow completes, your site will be available at `https://<USERNAME>.github.io/<REPO>/` or the GitHub Pages URL shown in your repo settings.

2) Firebase Hosting (Google)

- Prereqs: Node.js/npm and a Google account.
- Install Firebase CLI (one-time):

```bash
npm install -g firebase-tools
firebase login
```

- Initialize hosting (run inside `crewmatch` folder):

```bash
firebase init hosting
# When prompted, choose your Firebase project or create one, and set the public directory to '.' (or 'public' if you copy files there). Configure as a single-page app if asked (optional).
```

- Deploy:

```bash
firebase deploy --only hosting
```

- Firebase will return a URL like `https://PROJECT_ID.web.app`.

3) Netlify / Vercel (fast GUI)

- Netlify: https://app.netlify.com/drop — drag-and-drop the `crewmatch` folder zip.
- Vercel: https://vercel.com/new — import the GitHub repo and deploy.

Notes
- These instructions prepare the repository and CI workflow but cannot push to GitHub on your behalf without your credentials or the `gh` CLI configured.
- If you'd like, I can: (A) Help you run the commands locally step-by-step, (B) prepare a repository name and branch strategy, or (C) walk through Firebase initialization interactively.
