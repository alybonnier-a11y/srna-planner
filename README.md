# SRNA Planner

## Deploy to Vercel through GitHub
1. Create a new GitHub repo named `srna-planner`.
2. Upload all files from this folder into the repo.
3. In Vercel, click **Add New > Project**.
4. Import the GitHub repo.
5. Framework preset should detect **Vite**.
6. Build command: `npm run build`
7. Output directory: `dist`
8. Click Deploy.

## Firebase
This app uses Firestore at:
`planners/alyssa-summer-2026`

Make sure Firestore is created and rules allow test-mode reads/writes while setting up.
