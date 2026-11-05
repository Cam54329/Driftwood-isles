# Turning on online multiplayer (free Firebase project)

Driftwood Isles uses Firebase Realtime Database for online play: players see each other with name
tags, movement, casting, catches and boats, plus chat, emotes, the online list, the rare-catch feed,
shared leaderboards and cloud saves. Without these settings the game runs solo.

## 1. Create the Firebase project (about 5 minutes)
1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Create a project**, name it (for example `driftwood-isles`), and finish the wizard.
   Google Analytics is not needed.
3. In the left menu open **Build → Authentication → Get started**. Under **Sign-in method**,
   enable **Anonymous** and save.
4. Open **Build → Realtime Database → Create database**. Pick the location nearest your players and
   choose **Start in locked mode**.
5. In the database page open the **Rules** tab, replace everything with the contents of
   `database.rules.json` from this project, and click **Publish**. These rules keep each player's data
   private to them and reject impossible coins, levels and fish weights.

## 2. Copy the web app keys
1. Click the gear icon → **Project settings** → **Your apps** → the **</>** (Web) button.
   Register an app (any nickname, no hosting needed).
2. Firebase shows a `firebaseConfig` block. You need five values from it:
   `apiKey`, `authDomain`, `databaseURL`, `projectId`, `appId`.
   If `databaseURL` is missing, copy it from the top of the Realtime Database page
   (it looks like `https://your-project-default-rtdb.firebaseio.com`).
   These keys are meant to be public; the database rules are what protect the data.

## 3. Add the keys to Vercel
In Vercel open your project → **Settings → Environment Variables** and add:

| Name | Value |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | apiKey |
| `VITE_FIREBASE_AUTH_DOMAIN` | authDomain |
| `VITE_FIREBASE_DATABASE_URL` | databaseURL |
| `VITE_FIREBASE_PROJECT_ID` | projectId |
| `VITE_FIREBASE_APP_ID` | appId |

Then **Deployments → … → Redeploy**. The main menu's status line will say how many anglers are online.

For local testing, copy `.env.example` to `.env.local`, fill in the same values and run `npm run dev`.

## Testing without Firebase
Open the game with `?mp=local` in two tabs of the same browser: the tabs share the isles, so you can
see the other angler, chat and compare leaderboards.

## Free tier limits
The free Spark plan allows 100 players connected at once and 10 GB of downloads a month, which is plenty
for a group of friends. Each player sends a small update about five times a second while moving.
