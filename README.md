# Palmetto Diamond 4.0 — Ready for GitHub Pages

A no-subscription South Carolina high-school-baseball site with a working scoreboard, team directory, stat tables, standings, editorial rankings, stories, rosters, alumni directory, and an editor that can publish the public data file to your own GitHub repository.

**Key difference from Version 3:** The **Add a School** workflow now creates and opens the new team page, detects duplicates, and uses the same public dataset as the rest of the site. The editor has a direct **Publish to GitHub** control. An upload to your GitHub account is still necessary to make the site public initially; the provided files do not establish a public website on their own.

## Launch the site for free — step by step

1. Sign in to [GitHub](https://github.com/) or make an account for the **Palmetto Diamond publication**. GitHub repository owners and commit histories are public, so consider a dedicated brand account if you want to keep your coaching identity separate. Follow GitHub's account rules.
2. Create a **public repository** named `palmetto-diamond` (or a name you choose). On GitHub select **New repository**, enter the name, select **Public**, and click **Create repository**.
3. Unzip the supplied **palmetto-diamond-v4-website.zip**. Upload the website files to the **root** of your repository (not inside a nested `palmetto-diamond-v4` folder): `index.html`, `styles.css`, `app.js`, `publish.js`, `site-data.json`, the `.nojekyll` file, and the `assets/` folder. The repository README can also be included.
4. Go to the repository's **Settings → Pages**. Under **Build and deployment**, choose **Deploy from a branch**, then **main** and **/(root)**. Click **Save**. GitHub supplies a URL similar to `https://YOUR-USERNAME.github.io/palmetto-diamond/`. Give the Pages deployment time to complete.
5. To edit the website, open **your public URL followed by `?edit=1#admin`**, for example `https://YOUR-USERNAME.github.io/palmetto-diamond/?edit=1#admin`.
6. Open **Schools** and add a school. It should immediately open that school's new profile. Add the school's logo, roster, schedule and other details. Use **Stories** for previews and reports. The changes remain an unpublished draft until you complete the next steps.
7. To publish directly, create a [fine-grained personal access token](https://github.com/settings/personal-access-tokens/new) on GitHub with **Only select repositories → palmetto-diamond → Repository permissions: Contents = Read and write**. Set a reasonable expiry. **Never paste this token into a chat, public document or issue.**
8. In **Site editor → Publish data**, enter your GitHub username, repository, branch (`main`), and temporary token. Click **Connect & verify repository**, then **Publish saved changes online** and confirm. The editor commits the *public* `site-data.json` to your repository. GitHub Pages then publishes it; public visitors should see it after the deployment completes.
9. **Alternative if you don't want to use a token in the browser:** click **Export public site-data.json**, then use GitHub's **Add file → Upload files** to replace the existing `site-data.json`, and commit the change.

**Important:** This editor is not an authentication system. Opening `?edit=1` exposes editing controls, but public updates require the GitHub repository's restricted write token. Keep the token in a trusted browser session only; it is never saved by the site. If your brand requires a fully private password-protected newsroom later, it will need an authenticated backend.

## Using the site

- **School page editor:** Change the school name, classification, region, mascot, coaching information, overview and colors. Upload a logo. **Add a School** is available from the Teams page in editor mode or under Site editor → Schools.
- **Rosters:** Edit each player's name, jersey number, position and season eligibility.
- **Scores and schedules:** Select two schools and enter dates, game type, runs, innings and full GameChanger-style batting/pitching/fielding tables. Games, standings and statistics recalculate when saved.
- **Stories:** Create team previews, original articles and game recaps. Save unpublished drafts. Link stories to teams, add cover images and reopen them for editing. Only stories marked **Ready for public publishing** go into the public file.
- **Standings and RPI:** Region standings derive only from entered games. Official SCHSL RPI is **linked to MaxPreps** and not scraped or fabricated. The bracket is a **manual demonstration**, not an official projected SCHSL bracket.
- **Stats:** Default eligibility thresholds are 2.25 PA and 0.70 IP per team game equivalent, with adjustments for recorded shortened games. ERA is based on **seven innings**; pitching IP is stored in outs.
- **Alumni:** Only current college players, and all-time professional alumni marked Current or Former with the highest pro level reached and a source reference.
- **Photos:** Use team crests and photos only with appropriate permission. Images are compressed into public JSON data, so too many images can make the file large.

## Saving, restoring, switching devices

- **Before publishing:** Changes are locally saved in the browser you are using. Publishing moves verified public content into the repository for visitors.
- **When switching devices:** Open the editor and use **Publish data → Reload latest online data** to get the newest site version before editing. This action backs up and replaces the current browser draft.
- **Backups:** Use **Save full private backup** to keep unpublished stories and other edits. Do not place that private backup in your public repository.
- **Migrating from Version 3:** Open the Version 3 editor in the browser where you made edits and **Save full private backup**. In Version 4, open **Site editor → Publish data → Import backup**, load the file, check it, and publish from the new editor. Some browser downloads and local HTML files cannot share their local storage.
- **When something doesn't save:** If browser storage is blocked, your changes may only live during that tab session. The editor will warn you; use the export/backup tools or work on the real hosted page instead of a restricted preview.

## Technical notes

- This build uses only standard HTML, CSS and JavaScript (no build tool or paid service).
- Public data lives in `site-data.json`, so the **first** deployment must include that file.
- The site can read data publicly without a GitHub token. The editor's token is used only for the GitHub REST API to commit `site-data.json` to the specified repository and branch. The token is **not** stored in localStorage, sessionStorage, cookies, source code, or published data.
- The site checks the last retrieved GitHub file SHA to reduce accidental overwrites and stops if the file has changed since you connected. It also keeps a manual export path.
- No actual GitHub repository was created or used during development. The publisher has been tested with a simulated GitHub API, and successful live deployment depends on a real GitHub repository and account permissions.
- GitHub Pages is a static site hosting solution with usage restrictions. If the site develops into a commercial SaaS product, revisit hosting/licensing rather than assuming free GitHub Pages is appropriate.
- Box-score screenshot recognition, automatic MaxPreps feeds, full SCHSL playoff bracket rules, realtime multi-author editing and private admin accounts remain future features.

A fully independent website, unaffiliated with SCHSL, MaxPreps, or GameChanger. Publish only verified information and authorized photos/box-score data. 
