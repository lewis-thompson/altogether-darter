---
name: firebase-hosting-deploy
description: Deploy this app to Firebase Hosting from terminal using the same proven command flow in this repository. Run build, run hosting deploy with latest Firebase CLI, then stop and report success without extra verification.
---
# Purpose
Use this skill when the user asks to deploy the web app to Firebase Hosting.

# Project Context
- Run commands from repository root:
  - C:/Users/LewisThompson/dev/Altogether-Darter/altogether-darter
- Firebase project id:
  - altogether-darter

# Required Command Flow
1. Build production assets:
```powershell
npm.cmd run build
```

2. Deploy hosting with latest CLI:
```powershell
npx.cmd firebase-tools@latest deploy --only hosting --project altogether-darter --non-interactive
```

# Command Notes (Windows / PowerShell)
- Prefer `npm.cmd` and `npx.cmd` in this environment.
- If `npx.cmd` is not resolved in the current shell, use an explicit path:
```powershell
& "C:/Program Files/nodejs/npx.cmd" firebase-tools@latest deploy --only hosting --project altogether-darter --non-interactive
```

# Success Behavior
After the deploy command indicates deployment started/completed, report deployment as done and STOP.
Do not run additional verification/fetch checks unless the user explicitly asks.

# If Deploy Errors
- If error says the supplied version is already the current active version, treat it as a no-op deploy and report that Hosting is already on the latest live version.
- If auth/project errors occur, run:
```powershell
npx.cmd firebase-tools@latest login:list
npx.cmd firebase-tools@latest projects:list
```
Then continue deployment after fixing account/project selection.
