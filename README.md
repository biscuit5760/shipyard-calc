# Shipyard Calc

Offline calculator for the shipyard: tape-measure fractions, metric ⇄ imperial, and steel plate weight. Shows Spanish automatically when the phone is set to Spanish (words live in `i18n.js`).

Plain static files, no build step, no outside network calls. Open `index.html` from any web host.

## Put it on GitHub Pages
1. Make a public repo named `shipyard-calc` and upload everything in this folder (all files sit flat at the top level, no folders).
2. Repo Settings → Pages → Source: "Deploy from a branch", branch `main`, folder `/ (root)`.
3. After a minute it's live at `https://YOUR-USERNAME.github.io/shipyard-calc/`.

## Install prompt
Browsers never let a page install itself. The app shows a small strip under the title: an **Install app** button on Android Chrome/Edge/Samsung (opens the phone's own install box), a Share → Add to Home Screen tip on iPhone, or a menu / open-in-Chrome tip in other browsers. It hides once installed or opened from the home screen, and the ✕ hides it for 7 days.

## Updating later
Change the files, then bump `VERSION` at the top of `sw.js` (e.g. `shipyard-calc-v2`) so phones pick up the new version.

Privacy: the app sends one anonymous "opened" count to GoatCounter (once per day per device, plus once on a device's first open). No cookies, IDs, or personal info. Change or blank `COUNTER_URL` at the top of `app.js` to change or turn it off.
