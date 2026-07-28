Deploy (Firebase Hosting) and Firestore notes

This project is a React + Vite single-page app that uses Firestore for teams and matches.

Quick deploy to Firebase Hosting (existing project):

1) Ensure you have Firebase project and Firestore configured (Spark plan is fine). Copy your Firebase config into src/firebase.js.

2) Install dependencies and build:
   npm install
   npm run build

3) Install Firebase CLI and login:
   npm install -g firebase-tools
   firebase login

4) Initialize hosting (only once per repo):
   firebase init hosting
   - Select your Firebase project
   - Public directory: dist
   - Configure SPA: Yes (rewrite all URLs to /index.html)

5) Deploy:
   firebase deploy --only hosting

Firestore notes & rules
- The app reads/writes 'teams' and 'matches' collections.
- On Spark plan, all client-side operations must follow your Firestore security rules.
- For testing you can allow open reads/writes, but for production set rules to require authentication and restrict writes.

Local reset + clear DB
- Use the "Reset + Clear DB" button in the UI to delete all documents in teams and matches and re-create mock data (useful to avoid duplicates).

Limitations
- All tournament logic (recompute standings, resolve dependent matches) runs on the frontend. This is by design for Spark/free-tier compatibility. If multiple users edit concurrently you may encounter races. If you later switch to Blaze plan consider moving logic to Cloud Functions to ensure transactional safety.

If you want, I can create a firebase.json and .firebaserc for you and/or add a short script to automate deploy steps.

Firebase config files (examples created by the project):
- firebase.json: Hosting configuration that serves the dist/ folder and rewrites all URLs to index.html (SPA).
- .firebaserc: Stores the project alias mapping. Replace "YOUR_PROJECT_ID" with your actual Firebase project ID.

Firestore rules examples (dev vs prod)

1) Development (open, useful for quick testing):

// firestore.rules (dev - allow all, NOT for production)
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

2) Production (restrict writes to authenticated users; allow reads to everyone):

// firestore.rules (prod)
service cloud.firestore {
  match /databases/{database}/documents {
    // allow anyone to read
    match /{document=**} {
      allow read: if true;
    }

    // restrict writes to authenticated users
    match /{document=**} {
      allow write: if request.auth != null;
    }
  }
}

Notes about rules:
- For more granular control you can allow writes only to specific collections (e.g., let admins update teams/matches). See Firebase documentation: https://firebase.google.com/docs/firestore/security/rules-structure
- To deploy rules with Firebase CLI: firebase deploy --only firestore:rules

The repository now includes:
- firebase.json: Hosting configuration.
- .firebaserc: Project alias set to badminton-hadong-championships.
- firestore.rules: A production-safe Firestore rules template and a commented-out dev example.

After installing firebase-tools locally or globally, deploy hosting with:

npm run deploy

If you haven't logged in yet:

npx firebase login

Replace placeholders if you change projects, then deploy with Firebase CLI.