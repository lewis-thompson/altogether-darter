# Setup Checklist

## Firebase Configuration ✅

- [x] `.env.local` file created with credentials
- [x] `firestore.rules` updated with security rules
- [ ] Deploy rules to Firebase Console (you need to do this)

## To Deploy Firestore Rules

1. Go to https://console.firebase.google.com
2. Select "altogether-darter" project
3. Go to Firestore Database
4. Click "Rules" tab at the top
5. Copy and paste the entire contents of `firestore.rules`:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can only access their own user document
       match /users/{userId} {
         allow read, write: if request.auth.uid == userId;
         ...
       }
     }
   }
   ```
6. Click "Publish" button

## Code Structure ✅

- [x] Components created: GameHeader, PlayerSection, ScoreComponent, LoginPage, PageLayout
- [x] Services created: auth.ts, firestore.ts, firebase.ts  
- [x] Hooks created: useAuth.ts
- [x] Types organized: types/index.ts
- [x] App.tsx updated with authentication routing
- [ ] pages.tsx refactored to use new components (TODO for you)

## Testing Authentication

1. Run `npm run dev`
2. Should see login page
3. Click "Sign in with Google"
4. Sign in with your Google account
5. Should redirect to home page showing your name
6. Close browser completely
7. Reopen - should still be logged in

## Current Limitations

The old `pages.tsx` still has most of the code but doesn't use:
- [x] New components (GameHeader, PlayerSection, ScoreComponent)
- [x] Firebase authentication
- [x] Firestore database saving

This is what you'll need to update next.

## File Locations

| File | Purpose | Status |
|------|---------|--------|
| `.env.local` | Firebase config | ✅ Ready |
| `firestore.rules` | Security rules | ✅ Ready (needs deployment) |
| `src/services/auth.ts` | Google sign-in | ✅ Ready |
| `src/services/firestore.ts` | Database API | ✅ Ready |
| `src/components/` | Reusable UI | ✅ Ready |
| `src/pages.tsx` | Game pages | ❌ Needs refactoring |

## To Continue

1. Deploy Firestore rules (above)
2. Run `npm run dev` and test login
3. Start refactoring `pages.tsx` following examples in `REFACTORING_SUMMARY.md`
