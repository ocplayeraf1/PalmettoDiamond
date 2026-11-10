# Palmetto Diamond 9.0 — Historical seasons and player career histories

**SAFE ONE-FILE UPDATE:** The website code is all in `index.html`. The upgrade ZIP does **not** contain `site-data.json`, and it does not delete or replace your schools, rosters, games, scores, articles, tournament data, or logos in your GitHub repository.

## Before you install

1. On the computer where you previously made changes, **publish any browser-only edits** using Site editor → Publish data → Publish saved changes online.
2. Download a **full private backup** from the existing website editor.
3. In GitHub, download and keep a separate backup of your **current `site-data.json`**. Do not share this backup if it includes private content.
4. If you previously shared any GitHub access token, revoke that token in GitHub and create a new repository-restricted one. Never put a token into a ZIP, your repository, or a chat.

## Upgrade your existing GitHub Pages site

1. Download and extract `palmetto-diamond-v9-one-file-upgrade.zip`.
2. Open your existing GitHub repository (`PalmettoDiamond`) and switch to the branch publishing your site (`main` if unchanged).
3. Replace **only `index.html`** in the repository root. GitHub: **Add file → Upload files**, select the updated `index.html`, and commit it. If GitHub's browser uploader will not replace an existing file, open `index.html` in the repository and use **Edit (pencil)** to replace its contents, or delete the old `index.html` in the same commit workflow before uploading the new file.
4. **Do not replace or remove `site-data.json` or `assets/`.**
5. After GitHub Pages finishes deploying, reload the public site (Ctrl+Shift+R on Windows). The editing link remains `?edit=1#admin` at the end of the site address.

**Important:** A GitHub Pages code deployment does not publish changes saved only in your browser. When you add historical games, transfer histories, or college alumni on the website, use Site editor → Publish data → Publish saved changes online to make those data changes visible to readers.

## What V9 adds

### Historical rosters and games (pre-2026 supported)

- Open **Site Editor → Rosters → Historical seasons**.
- Enter any four-digit season from **1900 through 2099** (for example 2024 or 2025), then choose **Add / switch to season**.
- Build the roster through the usual roster editor. A new final or scheduled game entered with its real historical date is associated with that season automatically.
- The Players directory, team pages, schedule, scores, and statistics all use the selected season.

### Transfer players without losing historical stats

- Each player has **one permanent player ID** and a `rosterHistory` of season, school, position and number.
- For a player who already exists, open **Site Editor → Rosters**, select the school, edit the player and use **High school history → Add / update season** to assign an old or new school/year.
- Or use **Transfer / connect an existing player** to attach an existing player ID to a different school's roster instead of creating a duplicate profile.
- Existing game rows retain their original game-side school. An old game's stats remain credited to that school, even if the player later transfers.
- The player profile shows school-by-school seasons, combined high school totals, and the individual historical game log.

### Current college / all-time pro alumni linked to high school careers

- Open **Site Editor → College & pros**.
- Choose the player's high school and fill out the existing alumni fields.
- Select **Link to high school player profile**. Link deliberately by ID—never guess from a name alone.
- For current college players, enter **Current College** in the regular College field and add **Previous colleges / transfers** with institution, level and dates.
- On team Alumni pages, linked names open the high school player's lifetime statistics. On the individual player profile, college transfer history and verified pro status/peak level are shown.
- College listings remain **current rostered players only**; professional alumni remain **current and former**, with highest professional level displayed.

## What happens to your existing V8 information?

On first load, V9 reads the previous `teamId` and `rosterSeasons` fields and builds `rosterHistory` in memory. It also uses any already-entered game sides to preserve the school at which the player appeared. **No existing game stats or player IDs are deliberately changed.** Saving and publishing exports the richer structure as part of your existing `site-data.json`.

Do not create a second player if the same player transferred. Choose **Transfer / connect an existing player**. V9 does not automatically merge two separate profiles with similar names: that could mistakenly combine different people.

## Limitations

- This is a static GitHub Pages site with a browser editor and GitHub publishing, not a password-protected cloud database.
- Editing an old game is still manual; GameChanger screenshot recognition is not implemented.
- Previous college information is entered and verified by you, not pulled from live college rosters.
- Only *explicitly linked* alumni appear on a player's high school career profile. Unlinked entries remain in the school alumni listing so they are not accidentally merged.
- Existing public-site share previews still depend on publishing via the GitHub publisher to regenerate static social metadata pages.
- The V9 code and data migration were checked in a local browser with representative old-format data and hypothetical historical game records. Your actual GitHub deployment and live content have not been tested or altered directly.

## Recovery

If your page stops working after an upgrade, restore the previous `index.html` from GitHub file history. Keep the site's current `site-data.json` untouched. If you are changing computers and some work is missing, check the original browser's unpublished draft before reloading online data.
