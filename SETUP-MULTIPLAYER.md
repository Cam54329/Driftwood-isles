# Playing online with friends

There are two ways to play together.

## Option A: inside Claude (no setup)
The Claude page of the game already has online play switched on.
1. Open the page, click **Share**, and invite each friend by email. They need a free Claude account.
2. Give them **Contributor** (or edit) access so they can chat and appear on the leaderboard.
   Viewers can still fish with you and see everyone, but can't chat.
3. Everyone opens the same page. The main menu shows how many anglers are online.
Public "anyone with the link" visitors who aren't signed in can't join the live isles.

## Option B: your own website (Vercel + a free Firebase project)
Anyone with the address can play, with no accounts. Set it up once:


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

**No Vercel?** If you upload the `play-now` folder to any static host instead, open
`online-config.json` in that folder and paste the same five values into it. No rebuild needed.

## If it doesn't connect
Open **Multiplayer** on the main menu (or the players button in game → **Connection details**).
It shows the server, the connection status and, if something is wrong, the exact problem, for example:
- *Anonymous sign-in is turned off*: enable it under Authentication → Sign-in method.
- *The database rules blocked a write*: paste `database.rules.json` into the Rules tab and Publish.
- *The database URL is missing or wrong*: check `VITE_FIREBASE_DATABASE_URL` and redeploy.
- *The Firebase API key is not valid*: check `VITE_FIREBASE_API_KEY` and redeploy.
Remember to **redeploy** in Vercel after changing environment variables.

## Testing without Firebase
Open the game with `?mp=local` in two tabs of the same browser: the tabs share the isles, so you can
see the other angler, chat and compare leaderboards.

## Free tier limits
The free Spark plan allows 100 players connected at once and 10 GB of downloads a month, which is plenty
for a group of friends. Each player sends a small update about five times a second while moving.

## Owner tools: the dev bar and clearing chat for everyone

The dev bar (coins, levels, unlocks, teleport, time, weather, events, Tide Wells) and **Clear chat for everyone**
only unlock for the server owner. Your Firebase database checks a secret owner code that only you know. The code
is never stored in this repository, so it stays secret even though the repository is public.

One-time setup:

1. Paste the latest `database.rules.json` into **Realtime Database → Rules** and click **Publish**.
2. Open **Realtime Database → Data**. Hover the top line (the database name), click **+**, and add:
   - Key: `config`, then click **+** on `config` and add Key: `devCode`, Value: a secret word of your choice (for example `kraken-2041`).
   - Click **Add**.
3. In the game, open **Settings → Developer**, type the same code and press **Unlock**.

The game remembers the unlock on that browser. Press **`** (the key left of 1) or tap **DEV** at the top right to open the dev bar.
To change the code, edit `config/devCode` in Firebase. Old unlocks stop working for chat clearing straight away.

Anyone can clear chat on their own screen with the bin button in the chat box, or by typing `/clear`.
As the owner, `/clearall` in chat (or the dev bar button) clears it for everyone.
Coins, levels and items granted from the dev bar keep that save off the leaderboard.
